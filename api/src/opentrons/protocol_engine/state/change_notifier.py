"""Simple state change notification interface."""
from contextlib import contextmanager
from datetime import datetime
from typing import List, Iterator, Optional
from anyio import Event, fail_after


class ChangeNotifier:
    """An interface tto emit or subscribe to state change notifications."""

    def __init__(self) -> None:
        """Initialize the ChangeNotifier with an internal Event."""
        self._events: List[Event] = []

    def notify(self) -> None:
        """Notify all `wait`'ers that the state has changed."""
        for e in self._events:
            e.set()

    async def wait(self, timeout: Optional[float] = None) -> Optional[float]:
        """Wait until the next state change notification.

        Args:
            timeout: The number of seconds to wait for the notification.
                If `None`, will wait indefinitely.

        Returns:
            The number of seconds remaining in the timeout. You can use this
                return value to chain multiple calls to `wait`.

        Raises:
            TimeoutError: If `timeout` is reached for the change is notified.
        """
        start_time = datetime.now()

        with self._get_event() as event:
            with fail_after(timeout):
                await event.wait()

        if timeout is not None:
            elapsed_time = datetime.now() - start_time
            return max(0, timeout - elapsed_time.total_seconds())

        return None

    @contextmanager
    def _get_event(self) -> Iterator[Event]:
        event = Event()
        self._events.append(event)
        yield event
        self._events.remove(event)
