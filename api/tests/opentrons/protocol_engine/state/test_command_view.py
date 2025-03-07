"""Labware state store tests."""
import pytest
from contextlib import nullcontext as does_not_raise
from datetime import datetime
from typing import Dict, List, NamedTuple, Optional, Sequence, Type

from opentrons.ordered_set import OrderedSet

from opentrons.protocol_engine import EngineStatus, commands as cmd, errors

from opentrons.protocol_engine.state.commands import (
    CommandState,
    CommandView,
    CommandSlice,
    CommandEntry,
    CurrentCommand,
    RunResult,
    QueueStatus,
)

from .command_fixtures import (
    create_queued_command,
    create_running_command,
    create_failed_command,
    create_succeeded_command,
)


def get_command_view(
    queue_status: QueueStatus = QueueStatus.IMPLICITLY_ACTIVE,
    is_hardware_stopped: bool = False,
    is_door_blocking: bool = False,
    run_result: Optional[RunResult] = None,
    running_command_id: Optional[str] = None,
    queued_command_ids: Sequence[str] = (),
    errors_by_id: Optional[Dict[str, errors.ErrorOccurrence]] = None,
    commands: Sequence[cmd.Command] = (),
) -> CommandView:
    """Get a command view test subject."""
    all_command_ids = [command.id for command in commands]
    commands_by_id = {
        command.id: CommandEntry(index=index, command=command)
        for index, command in enumerate(commands)
    }

    state = CommandState(
        queue_status=queue_status,
        is_hardware_stopped=is_hardware_stopped,
        is_door_blocking=is_door_blocking,
        run_result=run_result,
        running_command_id=running_command_id,
        queued_command_ids=OrderedSet(queued_command_ids),
        errors_by_id=errors_by_id or {},
        all_command_ids=all_command_ids,
        commands_by_id=commands_by_id,
    )

    return CommandView(state=state)


def test_get_by_id() -> None:
    """It should get a command by ID from state."""
    command = create_succeeded_command(command_id="command-id")
    subject = get_command_view(commands=[command])

    assert subject.get("command-id") == command


def test_get_command_bad_id() -> None:
    """It should raise if a requested command ID isn't in state."""
    command = create_succeeded_command(command_id="command-id")
    subject = get_command_view(commands=[command])

    with pytest.raises(errors.CommandDoesNotExistError):
        subject.get("asdfghjkl")


def test_get_all() -> None:
    """It should get all the commands from the state."""
    command_1 = create_succeeded_command(command_id="command-id-1")
    command_2 = create_running_command(command_id="command-id-2")
    command_3 = create_queued_command(command_id="command-id-3")

    subject = get_command_view(commands=[command_1, command_2, command_3])

    assert subject.get_all() == [command_1, command_2, command_3]


@pytest.mark.parametrize(
    "queue_status", [QueueStatus.IMPLICITLY_ACTIVE, QueueStatus.ACTIVE]
)
def test_get_next_queued_returns_first_queued(queue_status: QueueStatus) -> None:
    """It should return the next queued command ID."""
    subject = get_command_view(
        queue_status=queue_status,
        queued_command_ids=["command-id-1", "command-id-2"],
    )

    assert subject.get_next_queued() == "command-id-1"


def test_get_next_queued_returns_none_when_no_pending() -> None:
    """It should return None if there are no queued commands."""
    subject = get_command_view(
        queue_status=QueueStatus.ACTIVE,
        queued_command_ids=[],
    )

    assert subject.get_next_queued() is None


def test_get_next_queued_returns_none_if_not_running() -> None:
    """It should return None if the engine is not running."""
    subject = get_command_view(
        queue_status=QueueStatus.INACTIVE,
        queued_command_ids=["command-id-1", "command-id-2"],
    )
    result = subject.get_next_queued()

    assert result is None


@pytest.mark.parametrize("run_result", RunResult)
def test_get_next_queued_raises_if_stopped(run_result: RunResult) -> None:
    """It should raise if an engine stop has been requested."""
    subject = get_command_view(run_result=run_result)

    with pytest.raises(errors.ProtocolEngineStoppedError):
        subject.get_next_queued()


def test_get_is_running_queue() -> None:
    """It should be able to get if the engine is running."""
    subject = get_command_view(queue_status=QueueStatus.INACTIVE)
    assert subject.get_is_running() is False

    subject = get_command_view(queue_status=QueueStatus.ACTIVE)
    assert subject.get_is_running() is True

    subject = get_command_view(queue_status=QueueStatus.IMPLICITLY_ACTIVE)
    assert subject.get_is_running() is True


def test_get_is_complete() -> None:
    """It should be able to tell if a command is complete."""
    completed_command = create_succeeded_command(command_id="command-id-1")
    failed_command = create_failed_command(command_id="command-id-2")
    running_command = create_running_command(command_id="command-id-3")
    pending_command = create_queued_command(command_id="command-id-4")

    subject = get_command_view(
        commands=[completed_command, failed_command, running_command, pending_command]
    )

    assert subject.get_is_complete("command-id-1") is True
    assert subject.get_is_complete("command-id-2") is True
    assert subject.get_is_complete("command-id-3") is False
    assert subject.get_is_complete("command-id-4") is False


def test_get_all_complete() -> None:
    """It should return true if no commands queued or running."""
    running_command = create_running_command(command_id="command-id-2")

    subject = get_command_view(queued_command_ids=[])
    assert subject.get_all_complete() is True

    subject = get_command_view(queued_command_ids=["queued-command-id"])
    assert subject.get_all_complete() is False

    subject = get_command_view(
        queued_command_ids=[], running_command_id="running-command-id"
    )
    assert subject.get_all_complete() is False

    subject = get_command_view(
        queued_command_ids=[],
        commands=[running_command],
    )
    assert subject.get_all_complete() is True


def test_get_should_stop() -> None:
    """It should return true if the run_result status is set."""
    subject = get_command_view(run_result=RunResult.SUCCEEDED)
    assert subject.get_stop_requested() is True

    subject = get_command_view(run_result=RunResult.FAILED)
    assert subject.get_stop_requested() is True

    subject = get_command_view(run_result=RunResult.STOPPED)
    assert subject.get_stop_requested() is True

    subject = get_command_view(run_result=None)
    assert subject.get_stop_requested() is False


def test_get_is_stopped() -> None:
    """It should return true if stop requested and no command running."""
    subject = get_command_view(is_hardware_stopped=False)
    assert subject.get_is_stopped() is False

    subject = get_command_view(is_hardware_stopped=True)
    assert subject.get_is_stopped() is True


class ActionAllowedSpec(NamedTuple):
    """Spec data to test CommandView.validate_action_allowed."""

    subject: CommandView
    expected_error: Optional[Type[errors.ProtocolEngineError]]


action_allowed_specs: List[ActionAllowedSpec] = [
    ActionAllowedSpec(
        subject=get_command_view(run_result=None),
        expected_error=None,
    ),
    ActionAllowedSpec(
        subject=get_command_view(run_result=RunResult.STOPPED),
        expected_error=errors.ProtocolEngineStoppedError,
    ),
    ActionAllowedSpec(
        subject=get_command_view(run_result=RunResult.SUCCEEDED),
        expected_error=errors.ProtocolEngineStoppedError,
    ),
    ActionAllowedSpec(
        subject=get_command_view(run_result=RunResult.FAILED),
        expected_error=errors.ProtocolEngineStoppedError,
    ),
]


@pytest.mark.parametrize(ActionAllowedSpec._fields, action_allowed_specs)
def test_validate_action_allowed(
    subject: CommandView,
    expected_error: Optional[Type[errors.ProtocolEngineError]],
) -> None:
    """It should validate allowed play/pause actions."""
    expectation = pytest.raises(expected_error) if expected_error else does_not_raise()

    with expectation:  # type: ignore[attr-defined]
        subject.raise_if_stop_requested()


class PlayAllowedSpec(NamedTuple):
    """Spec data to test CommandView.validate_action_allowed."""

    subject: CommandView
    expected_error: Optional[Type[errors.RobotDoorOpenError]]


play_allowed_specs: List[PlayAllowedSpec] = [
    PlayAllowedSpec(
        subject=get_command_view(
            is_door_blocking=True, queue_status=QueueStatus.IMPLICITLY_ACTIVE
        ),
        expected_error=None,
    ),
    PlayAllowedSpec(
        subject=get_command_view(
            is_door_blocking=True, queue_status=QueueStatus.INACTIVE
        ),
        expected_error=errors.RobotDoorOpenError,
    ),
    PlayAllowedSpec(
        subject=get_command_view(
            is_door_blocking=False, queue_status=QueueStatus.INACTIVE
        ),
        expected_error=None,
    ),
]


@pytest.mark.parametrize(PlayAllowedSpec._fields, play_allowed_specs)
def test_validate_action_for_door_status(
    subject: CommandView, expected_error: Optional[Type[errors.RobotDoorOpenError]]
) -> None:
    """It should raise error if playing when door open."""
    expectation = pytest.raises(expected_error) if expected_error else does_not_raise()

    with expectation:  # type: ignore[attr-defined]
        subject.raise_if_paused_by_blocking_door()


def test_get_errors() -> None:
    """It should be able to pull all ErrorOccurrences from the store."""
    error_1 = errors.ErrorOccurrence(
        id="error-1",
        createdAt=datetime(year=2021, month=1, day=1),
        errorType="ReallyBadError",
        detail="things could not get worse",
    )
    error_2 = errors.ErrorOccurrence(
        id="error-2",
        createdAt=datetime(year=2022, month=2, day=2),
        errorType="EvenWorseError",
        detail="things got worse",
    )

    subject = get_command_view(errors_by_id={"error-1": error_1, "error-2": error_2})

    assert subject.get_all_errors() == [error_1, error_2]


class GetStatusSpec(NamedTuple):
    """Spec data for get_status tests."""

    subject: CommandView
    expected_status: EngineStatus


get_status_specs: List[GetStatusSpec] = [
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.ACTIVE,
            running_command_id=None,
            queued_command_ids=[],
        ),
        expected_status=EngineStatus.RUNNING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.IMPLICITLY_ACTIVE,
            running_command_id="command-id",
            queued_command_ids=[],
        ),
        expected_status=EngineStatus.RUNNING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.IMPLICITLY_ACTIVE,
            running_command_id=None,
            queued_command_ids=["command-id"],
        ),
        expected_status=EngineStatus.RUNNING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.IMPLICITLY_ACTIVE,
            running_command_id=None,
            queued_command_ids=[],
        ),
        expected_status=EngineStatus.IDLE,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.INACTIVE,
            run_result=RunResult.SUCCEEDED,
            is_hardware_stopped=False,
        ),
        expected_status=EngineStatus.FINISHING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.INACTIVE,
            run_result=RunResult.FAILED,
            is_hardware_stopped=False,
        ),
        expected_status=EngineStatus.FINISHING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.INACTIVE,
        ),
        expected_status=EngineStatus.PAUSED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            run_result=RunResult.FAILED,
            is_hardware_stopped=True,
        ),
        expected_status=EngineStatus.FAILED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            run_result=RunResult.SUCCEEDED,
            is_hardware_stopped=True,
        ),
        expected_status=EngineStatus.SUCCEEDED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            run_result=RunResult.STOPPED,
            is_hardware_stopped=False,
        ),
        expected_status=EngineStatus.STOP_REQUESTED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            run_result=RunResult.STOPPED,
            is_hardware_stopped=True,
        ),
        expected_status=EngineStatus.STOPPED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.INACTIVE,
            is_door_blocking=True,
        ),
        expected_status=EngineStatus.BLOCKED_BY_OPEN_DOOR,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.IMPLICITLY_ACTIVE,
            is_door_blocking=True,
        ),
        expected_status=EngineStatus.IDLE,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.INACTIVE,
            is_door_blocking=False,
        ),
        expected_status=EngineStatus.PAUSED,
    ),
]


@pytest.mark.parametrize(GetStatusSpec._fields, get_status_specs)
def test_get_status(subject: CommandView, expected_status: EngineStatus) -> None:
    """It should set a status according to the command queue and running flag."""
    assert subject.get_status() == expected_status


class GetOkayToClearSpec(NamedTuple):
    """Spec data for get_status tests."""

    subject: CommandView
    expected_is_okay: bool


get_okay_to_clear_specs: List[GetOkayToClearSpec] = [
    GetOkayToClearSpec(
        subject=get_command_view(
            queue_status=QueueStatus.IMPLICITLY_ACTIVE,
            running_command_id=None,
            queued_command_ids=[],
        ),
        expected_is_okay=True,
    ),
    GetOkayToClearSpec(
        subject=get_command_view(
            queue_status=QueueStatus.IMPLICITLY_ACTIVE,
            running_command_id=None,
            queued_command_ids=["command-id"],
            commands=[create_queued_command(command_id="command-id")],
        ),
        expected_is_okay=False,
    ),
    GetOkayToClearSpec(
        subject=get_command_view(
            running_command_id=None,
            queued_command_ids=[],
            commands=[create_queued_command(command_id="command-id")],
        ),
        expected_is_okay=True,
    ),
    GetOkayToClearSpec(
        subject=get_command_view(
            is_hardware_stopped=True,
        ),
        expected_is_okay=True,
    ),
]


@pytest.mark.parametrize(GetOkayToClearSpec._fields, get_okay_to_clear_specs)
def test_get_okay_to_clear(subject: CommandView, expected_is_okay: bool) -> None:
    """It should okay only an unstarted or stopped engine to clear."""
    assert subject.get_is_okay_to_clear() is expected_is_okay


def test_get_current() -> None:
    """It should return the "current" command."""
    subject = get_command_view(
        running_command_id=None,
        queued_command_ids=[],
    )
    assert subject.get_current() is None

    command = create_running_command(
        "command-id",
        command_key="command-key",
        created_at=datetime(year=2021, month=1, day=1),
    )
    subject = get_command_view(
        running_command_id="command-id",
        queued_command_ids=[],
        commands=[command],
    )
    assert subject.get_current() == CurrentCommand(
        index=0,
        command_id="command-id",
        command_key="command-key",
        created_at=datetime(year=2021, month=1, day=1),
    )

    command_1 = create_succeeded_command(
        "command-id-1",
        command_key="key-1",
        created_at=datetime(year=2021, month=1, day=1),
    )
    command_2 = create_succeeded_command(
        "command-id-2",
        command_key="key-2",
        created_at=datetime(year=2022, month=2, day=2),
    )
    subject = get_command_view(commands=[command_1, command_2])
    assert subject.get_current() == CurrentCommand(
        index=1,
        command_id="command-id-2",
        command_key="key-2",
        created_at=datetime(year=2022, month=2, day=2),
    )

    command_1 = create_succeeded_command(
        "command-id-1",
        command_key="key-1",
        created_at=datetime(year=2021, month=1, day=1),
    )
    command_2 = create_failed_command(
        "command-id-2",
        command_key="key-2",
        created_at=datetime(year=2022, month=2, day=2),
    )
    subject = get_command_view(commands=[command_1, command_2])
    assert subject.get_current() == CurrentCommand(
        index=1,
        command_id="command-id-2",
        command_key="key-2",
        created_at=datetime(year=2022, month=2, day=2),
    )


def test_get_slice_empty() -> None:
    """It should return a slice from the tail if no current command."""
    subject = get_command_view(commands=[])
    result = subject.get_slice(cursor=None, length=2)

    assert result == CommandSlice(commands=[], cursor=0, total_length=0)


def test_get_slice() -> None:
    """It should return a slice of all commands."""
    command_1 = create_succeeded_command(command_id="command-id-1")
    command_2 = create_running_command(command_id="command-id-2")
    command_3 = create_queued_command(command_id="command-id-3")
    command_4 = create_queued_command(command_id="command-id-4")

    subject = get_command_view(commands=[command_1, command_2, command_3, command_4])

    result = subject.get_slice(cursor=1, length=3)

    assert result == CommandSlice(
        commands=[command_2, command_3, command_4],
        cursor=1,
        total_length=4,
    )

    result = subject.get_slice(cursor=-3, length=10)

    assert result == CommandSlice(
        commands=[command_1, command_2, command_3, command_4],
        cursor=0,
        total_length=4,
    )


def test_get_slice_default_cursor() -> None:
    """It should use the tail as the default cursor location."""
    command_1 = create_succeeded_command(command_id="command-id-1")
    command_2 = create_succeeded_command(command_id="command-id-2")
    command_3 = create_running_command(command_id="command-id-3")
    command_4 = create_queued_command(command_id="command-id-4")

    subject = get_command_view(
        commands=[command_1, command_2, command_3, command_4],
    )

    result = subject.get_slice(cursor=None, length=2)

    assert result == CommandSlice(
        commands=[command_3, command_4],
        cursor=2,
        total_length=4,
    )


def test_get_slice_default_cursor_no_current() -> None:
    """It should return a slice from the tail if no current command."""
    command_1 = create_succeeded_command(command_id="command-id-1")
    command_2 = create_succeeded_command(command_id="command-id-2")
    command_3 = create_succeeded_command(command_id="command-id-3")
    command_4 = create_succeeded_command(command_id="command-id-4")

    subject = get_command_view(commands=[command_1, command_2, command_3, command_4])

    result = subject.get_slice(cursor=None, length=3)

    assert result == CommandSlice(
        commands=[command_2, command_3, command_4],
        cursor=1,
        total_length=4,
    )
