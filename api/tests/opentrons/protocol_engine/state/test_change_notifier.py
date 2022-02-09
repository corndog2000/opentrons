"""Tests for the ChangeNotifier interface."""
import pytest
from anyio import create_task_group, sleep
from typing import NamedTuple, Optional, cast
from opentrons.protocol_engine.state.change_notifier import ChangeNotifier


async def _notify(subject: ChangeNotifier, delay: float = 0) -> None:
    await sleep(delay)
    subject.notify()


class WaitSpec(NamedTuple):
    """Test data for ChangeNotifier.wait."""

    delay: float
    timeout: Optional[float]
    expected: Optional[float]


@pytest.mark.parametrize(
    WaitSpec._fields,
    [
        WaitSpec(delay=0, timeout=None, expected=None),
        WaitSpec(
            delay=0.1,
            timeout=1.0,
            expected=cast(float, pytest.approx(0.9, rel=0.02)),
        ),
    ],
)
async def test_waits_and_returns_remaining_timeout(
    delay: float,
    timeout: Optional[float],
    expected: Optional[float],
) -> None:
    """It should be able to wait with a timeout."""
    subject = ChangeNotifier()

    async with create_task_group() as tg:
        tg.start_soon(_notify, subject, delay)
        result = await subject.wait(timeout=timeout)

    assert result == expected


async def test_raises_timeout_error() -> None:
    """It should raise a timeout error if the timeout passes."""
    delay = 0.1
    timeout = 0.05
    subject = ChangeNotifier()

    async with create_task_group() as tg:
        tg.start_soon(_notify, subject, delay)

        with pytest.raises(TimeoutError):
            await subject.wait(timeout=timeout)


@pytest.mark.parametrize("count", range(10))
async def test_multiple_subscribers(count: int) -> None:
    """Test that multiple subscribers can wait for a notification.

    This test checks that the subscribers are awoken in the order they
    subscribed, which may or may not be guarenteed according to the
    implementation of the event loop.

    The test runs multiple times to check for flakiness.
    """
    subject = ChangeNotifier()
    results = []

    async def _do_task_1() -> None:
        await subject.wait()
        results.append(1)

    async def _do_task_2() -> None:
        await subject.wait()
        results.append(2)

    async def _do_task_3() -> None:
        await subject.wait()
        results.append(3)

    async with create_task_group() as tg:
        tg.start_soon(_do_task_1)
        tg.start_soon(_do_task_2)
        tg.start_soon(_do_task_3)
        tg.start_soon(_notify, subject)

    assert results == [1, 2, 3]
