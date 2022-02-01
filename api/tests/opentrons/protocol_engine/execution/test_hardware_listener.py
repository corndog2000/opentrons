"""Test hardware stopping execution and side effects."""
import pytest
from anyio import to_thread
from decoy import Decoy, matchers

from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.types import DoorStateNotification
from opentrons.protocol_engine.actions import ActionDispatcher, HardwareEventAction
from opentrons.protocol_engine.execution import HardwareListener


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mocked out HardwareAPI instance."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def action_dispatcher(decoy: Decoy) -> ActionDispatcher:
    """Get a mocked out MovementHandler."""
    return decoy.mock(cls=ActionDispatcher)


@pytest.fixture
async def subject(
    hardware_api: HardwareAPI,
    action_dispatcher: ActionDispatcher,
) -> HardwareListener:
    """Get a HardwareListener test subject with its dependencies mocked out."""
    return HardwareListener(
        hardware_api=hardware_api,
        action_dispatcher=action_dispatcher,
    )


async def test_listen(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    action_dispatcher: ActionDispatcher,
    subject: HardwareListener,
) -> None:
    """It should halt the hardware API."""
    callback_captor = matchers.Captor()
    door_notification = DoorStateNotification()

    subject.listen()
    decoy.verify(hardware_api.register_callback(callback_captor))

    await to_thread.run_sync(callback_captor.value, door_notification)

    decoy.verify(
        action_dispatcher.dispatch(HardwareEventAction(event=door_notification))
    )


async def test_stop(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    action_dispatcher: ActionDispatcher,
    subject: HardwareListener,
) -> None:
    """It should be able to stop listening."""
    unsubscribe = decoy.mock()

    decoy.when(hardware_api.register_callback(matchers.Anything())).then_return(
        unsubscribe
    )

    subject.listen()
    subject.stop()

    decoy.verify(unsubscribe(), times=1)


async def test_one_handler(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    action_dispatcher: ActionDispatcher,
    subject: HardwareListener,
) -> None:
    """It should not attach multiple callbacks."""
    unsubscribe = decoy.mock()
    wrong_unsubscribe = decoy.mock()

    decoy.when(hardware_api.register_callback(matchers.Anything())).then_return(
        unsubscribe, wrong_unsubscribe
    )

    subject.listen()
    subject.listen()
    subject.stop()
    subject.stop()

    decoy.verify(unsubscribe(), times=1)
    decoy.verify(wrong_unsubscribe(), times=0)
