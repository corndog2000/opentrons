"""Hardware listener."""
import asyncio
import logging
from typing import Callable, Optional

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import HardwareEvent
from ..actions import ActionDispatcher, HardwareEventAction


log = logging.getLogger(__name__)


class HardwareListener:
    """Class to implement hardware event listening."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        action_dispatcher: ActionDispatcher,
    ) -> None:
        """Hardware event listener.

        Hardware callbacks will be called from a separate thread, so care
        should be taken to ensure thread safety.
        """
        self._hardware_api = hardware_api
        self._action_dispatcher = action_dispatcher
        self._loop = asyncio.get_running_loop()
        self._unsubscribe: Optional[Callable[[], None]] = None

    def listen(self) -> None:
        """Listen for hardware events."""
        if self._unsubscribe is None:
            self._unsubscribe = self._hardware_api.register_callback(
                self._handle_hardware_event
            )

    def stop(self) -> None:
        """Stop listening for hardware events."""
        unsubscribe = self._unsubscribe

        if unsubscribe is not None:
            unsubscribe()
            self._unsubscribe = None

    def _handle_hardware_event(self, event: HardwareEvent) -> None:
        """Handle a hardware event, ensuring thread safety."""
        coro = self._dispatch_event_action(event)
        return asyncio.run_coroutine_threadsafe(coro, loop=self._loop).result()

    async def _dispatch_event_action(self, event: HardwareEvent) -> None:
        """Dispatch a HardwareEventAction.

        Defined as an async function so we can run it to completion
        in the proper thread.
        """
        self._action_dispatcher.dispatch(HardwareEventAction(event=event))
