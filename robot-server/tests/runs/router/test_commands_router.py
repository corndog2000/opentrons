"""Tests for the /runs/.../commands routes."""
import pytest

from datetime import datetime
from decoy import Decoy, matchers

from opentrons.protocol_engine import (
    CommandSlice,
    CurrentCommand,
    ProtocolEngine,
    commands as pe_commands,
    errors as pe_errors,
)

from robot_server.errors import ApiError
from robot_server.service.json_api import (
    RequestModel,
    MultiBodyMeta,
)

from robot_server.runs.run_store import RunStore, RunNotFoundError, CommandNotFoundError
from robot_server.runs.engine_store import EngineStore
from robot_server.runs.run_data_manager import RunDataManager
from robot_server.runs.run_models import RunCommandSummary
from robot_server.runs.router.commands_router import (
    CommandCollectionLinks,
    CommandLink,
    CommandLinkMeta,
    create_run_command,
    get_run_command,
    get_run_commands,
    get_current_run_engine_from_url,
)


async def test_get_current_run_engine_from_url(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
) -> None:
    """Should get an instance of a run protocol engine."""
    decoy.when(mock_run_store.has("run-id")).then_return(True)
    decoy.when(mock_engine_store.current_run_id).then_return("run-id")

    result = await get_current_run_engine_from_url(
        runId="run-id",
        engine_store=mock_engine_store,
        run_store=mock_run_store,
    )

    assert result is mock_engine_store.engine


async def test_get_current_run_engine_no_run(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
) -> None:
    """It should 404 if the run is not in the store."""
    decoy.when(mock_run_store.has("run-id")).then_return(False)

    with pytest.raises(ApiError) as exc_info:
        await get_current_run_engine_from_url(
            runId="run-id",
            engine_store=mock_engine_store,
            run_store=mock_run_store,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_get_current_run_engine_from_url_not_current(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
) -> None:
    """It should 409 if you try to add commands to non-current run."""
    decoy.when(mock_run_store.has("run-id")).then_return(True)
    decoy.when(mock_engine_store.current_run_id).then_return("some-other-run-id")

    with pytest.raises(ApiError) as exc_info:
        await get_current_run_engine_from_url(
            runId="run-id",
            engine_store=mock_engine_store,
            run_store=mock_run_store,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunStopped"


async def test_create_run_command(
    decoy: Decoy,
    mock_protocol_engine: ProtocolEngine,
) -> None:
    """It should add the requested command to the ProtocolEngine and return it."""
    command_request = pe_commands.PauseCreate(
        params=pe_commands.PauseParams(message="Hello")
    )

    command_once_added = pe_commands.Pause(
        id="command-id",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_commands.CommandStatus.QUEUED,
        params=pe_commands.PauseParams(message="Hello"),
    )

    decoy.when(mock_protocol_engine.add_command(command_request)).then_return(
        command_once_added
    )

    decoy.when(mock_protocol_engine.state_view.commands.get("command-id")).then_return(
        command_once_added
    )

    result = await create_run_command(
        request_body=RequestModel(data=command_request),
        waitUntilComplete=False,
        protocol_engine=mock_protocol_engine,
    )

    assert result.content.data == command_once_added
    assert result.status_code == 201
    decoy.verify(await mock_protocol_engine.wait_for_command("command-id"), times=0)


async def test_create_run_command_blocking_completion(
    decoy: Decoy, mock_protocol_engine: ProtocolEngine
) -> None:
    """It should return the completed command once the command is completed."""
    command_request = pe_commands.PauseCreate(
        params=pe_commands.PauseParams(message="Hello")
    )

    command_once_added = pe_commands.Pause(
        id="command-id",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_commands.CommandStatus.QUEUED,
        params=pe_commands.PauseParams(message="Hello"),
    )

    command_once_completed = pe_commands.Pause(
        id="command-id",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_commands.CommandStatus.SUCCEEDED,
        params=pe_commands.PauseParams(message="Hello"),
    )

    def _stub_queued_command_state(*_a: object, **_k: object) -> pe_commands.Command:
        decoy.when(
            mock_protocol_engine.state_view.commands.get("command-id")
        ).then_return(command_once_added)
        return command_once_added

    def _stub_completed_command_state(*_a: object, **_k: object) -> None:
        decoy.when(
            mock_protocol_engine.state_view.commands.get("command-id")
        ).then_return(command_once_completed)

    decoy.when(mock_protocol_engine.add_command(command_request)).then_do(
        _stub_queued_command_state
    )

    decoy.when(await mock_protocol_engine.wait_for_command("command-id")).then_do(
        _stub_completed_command_state
    )

    result = await create_run_command(
        request_body=RequestModel(data=command_request),
        waitUntilComplete=True,
        timeout=999,
        protocol_engine=mock_protocol_engine,
    )

    assert result.content.data == command_once_completed
    assert result.status_code == 201


async def test_get_run_commands(
    decoy: Decoy, mock_run_data_manager: RunDataManager
) -> None:
    """It should return a list of all commands in a run."""
    command = pe_commands.Pause(
        id="command-id",
        key="command-key",
        status=pe_commands.CommandStatus.FAILED,
        createdAt=datetime(year=2021, month=1, day=1),
        startedAt=datetime(year=2022, month=2, day=2),
        completedAt=datetime(year=2023, month=3, day=3),
        params=pe_commands.PauseParams(message="hello world"),
        error=pe_errors.ErrorOccurrence(
            id="error-id",
            errorType="PrettyBadError",
            createdAt=datetime(year=2024, month=4, day=4),
            detail="Things are not looking good.",
        ),
    )

    decoy.when(mock_run_data_manager.get_current_command("run-id")).then_return(
        CurrentCommand(
            command_id="current-command-id",
            command_key="current-command-key",
            created_at=datetime(year=2024, month=4, day=4),
            index=101,
        )
    )
    decoy.when(
        mock_run_data_manager.get_commands_slice(
            run_id="run-id",
            cursor=None,
            length=42,
        )
    ).then_return(CommandSlice(commands=[command], cursor=1, total_length=3))

    result = await get_run_commands(
        runId="run-id",
        run_data_manager=mock_run_data_manager,
        cursor=None,
        pageLength=42,
    )

    assert result.content.data == [
        RunCommandSummary(
            id="command-id",
            key="command-key",
            commandType="pause",
            createdAt=datetime(year=2021, month=1, day=1),
            startedAt=datetime(year=2022, month=2, day=2),
            completedAt=datetime(year=2023, month=3, day=3),
            status=pe_commands.CommandStatus.FAILED,
            params=pe_commands.PauseParams(message="hello world"),
            error=pe_errors.ErrorOccurrence(
                id="error-id",
                errorType="PrettyBadError",
                createdAt=datetime(year=2024, month=4, day=4),
                detail="Things are not looking good.",
            ),
        )
    ]
    assert result.content.meta == MultiBodyMeta(cursor=1, totalLength=3)
    assert result.content.links == CommandCollectionLinks(
        current=CommandLink(
            href="/runs/run-id/commands/current-command-id",
            meta=CommandLinkMeta(
                runId="run-id",
                commandId="current-command-id",
                key="current-command-key",
                createdAt=datetime(year=2024, month=4, day=4),
                index=101,
            ),
        )
    )
    assert result.status_code == 200


async def test_get_run_commands_empty(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
) -> None:
    """It should return an empty commands list if no commands."""
    decoy.when(mock_run_data_manager.get_current_command("run-id")).then_return(None)
    decoy.when(
        mock_run_data_manager.get_commands_slice(run_id="run-id", cursor=21, length=42)
    ).then_return(CommandSlice(commands=[], cursor=0, total_length=0))

    result = await get_run_commands(
        runId="run-id",
        run_data_manager=mock_run_data_manager,
        cursor=21,
        pageLength=42,
    )

    assert result.content.data == []
    assert result.content.meta == MultiBodyMeta(cursor=0, totalLength=0)
    assert result.content.links == CommandCollectionLinks(current=None)
    assert result.status_code == 200


async def test_get_run_commands_not_found(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
) -> None:
    """It should 404 if the run is not found."""
    not_found_error = RunNotFoundError("oh no")

    decoy.when(
        mock_run_data_manager.get_commands_slice(run_id="run-id", cursor=21, length=42)
    ).then_raise(not_found_error)
    decoy.when(mock_run_data_manager.get_current_command(run_id="run-id")).then_raise(
        not_found_error
    )

    with pytest.raises(ApiError) as exc_info:
        await get_run_commands(
            runId="run-id",
            run_data_manager=mock_run_data_manager,
            cursor=21,
            pageLength=42,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_get_run_command_by_id(
    decoy: Decoy, mock_run_data_manager: RunDataManager
) -> None:
    """It should return full details about a command by ID."""
    command = pe_commands.MoveToWell(
        id="command-id",
        key="command-key",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=datetime(year=2022, month=2, day=2),
        params=pe_commands.MoveToWellParams(pipetteId="a", labwareId="b", wellName="c"),
    )

    decoy.when(mock_run_data_manager.get_command("run-id", "command-id")).then_return(
        command
    )

    result = await get_run_command(
        runId="run-id",
        commandId="command-id",
        run_data_manager=mock_run_data_manager,
    )

    assert result.content.data == command
    assert result.status_code == 200


@pytest.mark.parametrize(
    "exception",
    [
        CommandNotFoundError("oh no"),
        RunNotFoundError("oh no"),
    ],
)
async def test_get_run_command_missing(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    exception: Exception,
) -> None:
    """It should 404 if you attempt to get a non-existent command."""
    decoy.when(
        mock_run_data_manager.get_command(run_id="run-id", command_id="command-id")
    ).then_raise(exception)

    with pytest.raises(ApiError) as exc_info:
        await get_run_command(
            runId="run-id",
            commandId="command-id",
            run_data_manager=mock_run_data_manager,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["detail"] == matchers.StringMatching(
        "oh no"
    )
