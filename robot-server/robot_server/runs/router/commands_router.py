"""Router for /runs commands endpoints."""
from anyio import move_on_after
from datetime import datetime
from typing import Optional, Union
from typing_extensions import Final, Literal

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field

from opentrons.protocol_engine import ProtocolEngine, commands as pe_commands

from robot_server.errors import ErrorDetails, ErrorBody
from robot_server.service.json_api import (
    RequestModel,
    SimpleBody,
    MultiBody,
    MultiBodyMeta,
    PydanticResponse,
)

from ..run_models import RunCommandSummary
from ..run_data_manager import RunDataManager
from ..engine_store import EngineStore
from ..run_store import RunStore, RunNotFoundError, CommandNotFoundError
from ..dependencies import get_engine_store, get_run_data_manager, get_run_store
from .base_router import RunNotFound, RunStopped


_DEFAULT_COMMAND_LIST_LENGTH: Final = 20
_DEFAULT_COMMAND_WAIT_MS: Final = 30_000

commands_router = APIRouter()


class CommandNotFound(ErrorDetails):
    """An error if a given run command is not found."""

    id: Literal["CommandNotFound"] = "CommandNotFound"
    title: str = "Run Command Not Found"


class CommandLinkMeta(BaseModel):
    """Metadata about a command resource referenced in `links`."""

    runId: str = Field(..., description="The ID of the command's run.")
    commandId: str = Field(..., description="The ID of the command.")
    index: int = Field(..., description="Index of the command in the overall list.")
    key: str = Field(..., description="Value of the current command's `key` field.")
    createdAt: datetime = Field(
        ...,
        description="When the current command was created.",
    )


class CommandLink(BaseModel):
    """A link to a command resource."""

    href: str = Field(..., description="The path to a command")
    meta: CommandLinkMeta = Field(..., description="Information about the command.")


class CommandCollectionLinks(BaseModel):
    """Links returned along with a collection of commands."""

    current: Optional[CommandLink] = Field(
        None,
        description="Path to the currently running or next queued command.",
    )


async def get_current_run_engine_from_url(
    runId: str,
    engine_store: EngineStore = Depends(get_engine_store),
    run_store: RunStore = Depends(get_run_store),
) -> ProtocolEngine:
    """Get run protocol engine.

    Args:
        runId: Run ID to associate the command with.
        engine_store: Engine store to pull current run ProtocolEngine.
        run_store: Run data storage.
    """
    if not run_store.has(runId):
        raise RunNotFound(detail=f"Run {runId} not found.").as_error(
            status.HTTP_404_NOT_FOUND
        )

    if runId != engine_store.current_run_id:
        raise RunStopped(detail=f"Run {runId} is not the current run").as_error(
            status.HTTP_409_CONFLICT
        )

    return engine_store.engine


@commands_router.post(
    path="/runs/{runId}/commands",
    summary="Enqueue a protocol command",
    description=(
        "Add a single protocol command to the run. "
        "The command is placed at the back of the queue."
    ),
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[pe_commands.Command]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[RunStopped]},
    },
)
async def create_run_command(
    request_body: RequestModel[pe_commands.CommandCreate],
    waitUntilComplete: bool = Query(
        default=False,
        description=(
            "If `false`, return immediately, while the new command is still queued."
            "\n\n"
            "If `true`, only return once the new command succeeds or fails,"
            " or when the timeout is reached. See the `timeout` query parameter."
        ),
    ),
    timeout: int = Query(
        default=_DEFAULT_COMMAND_WAIT_MS,
        gt=0,
        description=(
            "If `waitUntilComplete` is `true`,"
            " the maximum number of milliseconds to wait before returning."
            "\n\n"
            "Ignored if `waitUntilComplete` is `false`."
            "\n\n"
            "The timer starts when the new command is enqueued,"
            " *not* when it starts running."
            " So if a different command runs before the new command,"
            " it may exhaust the timeout even if the new command on its own"
            " would have completed in time."
            "\n\n"
            "If the timeout triggers, the command will still be returned"
            " with a `201` HTTP status code."
            " Inspect the returned command's `status` to detect the timeout."
        ),
    ),
    protocol_engine: ProtocolEngine = Depends(get_current_run_engine_from_url),
) -> PydanticResponse[SimpleBody[pe_commands.Command]]:
    """Enqueue a protocol command.

    Arguments:
        request_body: The request containing the command that the client wants
            to enqueue.
        waitUntilComplete: If True, return only once the command is completed.
            Else, return immediately. Comes from a query parameter in the URL.
        timeout: The maximum time, in seconds, to wait before returning.
            Comes from a query parameter in the URL.
        protocol_engine: Used to retrieve the `ProtocolEngine` on which the new
            command will be enqueued.
    """
    command = protocol_engine.add_command(request_body.data)

    if waitUntilComplete:
        with move_on_after(timeout / 1000.0):
            await protocol_engine.wait_for_command(command.id),

    response_data = protocol_engine.state_view.commands.get(command.id)

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=response_data),
        status_code=status.HTTP_201_CREATED,
    )


@commands_router.get(
    path="/runs/{runId}/commands",
    summary="Get a list of all protocol commands in the run",
    description=(
        "Get a list of all commands in the run and their statuses. "
        "This endpoint returns command summaries. Use "
        "`GET /runs/{runId}/commands/{commandId}` to get all "
        "information available for a given command."
    ),
    responses={
        status.HTTP_200_OK: {
            "model": MultiBody[RunCommandSummary, CommandCollectionLinks]
        },
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
    },
)
async def get_run_commands(
    runId: str,
    cursor: Optional[int] = Query(
        None,
        description=(
            "The starting index of the desired first command in the list."
            " If unspecified, a cursor will be selected automatically"
            " based on the next queued or more recently executed command."
        ),
    ),
    pageLength: int = Query(
        _DEFAULT_COMMAND_LIST_LENGTH,
        description="The maximum number of commands in the list to return.",
    ),
    run_data_manager: RunDataManager = Depends(get_run_data_manager),
) -> PydanticResponse[MultiBody[RunCommandSummary, CommandCollectionLinks]]:
    """Get a summary of a set of commands in a run.

    Arguments:
        runId: Requested run ID, from the URL
        cursor: Cursor index for the collection response.
        pageLength: Maximum number of items to return.
        run_data_manager: Run data retrieval interface.
    """
    try:
        command_slice = run_data_manager.get_commands_slice(
            run_id=runId,
            cursor=cursor,
            length=pageLength,
        )
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    current_command = run_data_manager.get_current_command(run_id=runId)

    data = [
        RunCommandSummary.construct(
            id=c.id,
            key=c.key,
            commandType=c.commandType,
            status=c.status,
            createdAt=c.createdAt,
            startedAt=c.startedAt,
            completedAt=c.completedAt,
            params=c.params,
            error=c.error,
        )
        for c in command_slice.commands
    ]

    meta = MultiBodyMeta(
        cursor=command_slice.cursor,
        totalLength=command_slice.total_length,
    )

    links = CommandCollectionLinks()

    if current_command is not None:
        links.current = CommandLink(
            href=f"/runs/{runId}/commands/{current_command.command_id}",
            meta=CommandLinkMeta(
                runId=runId,
                commandId=current_command.command_id,
                index=current_command.index,
                key=current_command.command_key,
                createdAt=current_command.created_at,
            ),
        )

    return await PydanticResponse.create(
        content=MultiBody.construct(data=data, meta=meta, links=links),
        status_code=status.HTTP_200_OK,
    )


@commands_router.get(
    path="/runs/{runId}/commands/{commandId}",
    summary="Get full details about a specific command in the run",
    description=(
        "Get a command along with any associated payload, result, and "
        "execution information."
    ),
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[pe_commands.Command]},
        status.HTTP_404_NOT_FOUND: {
            "model": Union[ErrorBody[RunNotFound], ErrorBody[CommandNotFound]]
        },
    },
)
async def get_run_command(
    runId: str,
    commandId: str,
    run_data_manager: RunDataManager = Depends(get_run_data_manager),
) -> PydanticResponse[SimpleBody[pe_commands.Command]]:
    """Get a specific command from a run.

    Arguments:
        runId: Run identifier, pulled from route parameter.
        commandId: Command identifier, pulled from route parameter.
        run_data_manager: Run data retrieval.
    """
    try:
        command = run_data_manager.get_command(run_id=runId, command_id=commandId)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e
    except CommandNotFoundError as e:
        raise CommandNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=command),
        status_code=status.HTTP_200_OK,
    )
