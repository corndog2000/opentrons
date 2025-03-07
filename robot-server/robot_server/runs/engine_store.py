"""In-memory storage of ProtocolEngine instances."""
from typing import List, NamedTuple, Optional

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_runner import ProtocolRunner, ProtocolRunResult
from opentrons.protocol_engine import (
    ProtocolEngine,
    StateSummary,
    LabwareOffsetCreate,
    create_protocol_engine,
)


from robot_server.protocols import ProtocolResource


class EngineConflictError(RuntimeError):
    """An error raised if an active engine is already initialized.

    The store will not create a new engine unless the "current" runner/engine
    pair is idle.
    """


class RunnerEnginePair(NamedTuple):
    """A stored ProtocolRunner/ProtocolEngine pair."""

    run_id: str
    runner: ProtocolRunner
    engine: ProtocolEngine


class EngineStore:
    """Factory and in-memory storage for ProtocolEngine."""

    def __init__(self, hardware_api: HardwareControlAPI) -> None:
        """Initialize an engine storage interface.

        Arguments:
            hardware_api: Hardware control API instance used for ProtocolEngine
                construction.
        """
        self._hardware_api = hardware_api
        self._default_engine: Optional[ProtocolEngine] = None
        self._runner_engine_pair: Optional[RunnerEnginePair] = None

    @property
    def engine(self) -> ProtocolEngine:
        """Get the "current" persisted ProtocolEngine."""
        assert self._runner_engine_pair is not None, "Engine not yet created."
        return self._runner_engine_pair.engine

    @property
    def runner(self) -> ProtocolRunner:
        """Get the "current" persisted ProtocolRunner."""
        assert self._runner_engine_pair is not None, "Runner not yet created."
        return self._runner_engine_pair.runner

    @property
    def current_run_id(self) -> Optional[str]:
        """Get the run identifier associated with the current engine/runner pair."""
        return (
            self._runner_engine_pair.run_id
            if self._runner_engine_pair is not None
            else None
        )

    # TODO(mc, 2022-03-21): this resource locking is insufficient;
    # come up with something more sophisticated without race condition holes.
    async def get_default_engine(self) -> ProtocolEngine:
        """Get a "default" ProtocolEngine to use outside the context of a run.

        Raises:
            EngineConflictError: if a run-specific engine is active.
        """
        if self._runner_engine_pair is not None:
            raise EngineConflictError("An engine for a run is currently active")

        engine = self._default_engine

        if engine is None:
            # TODO(mc, 2022-03-21): potential race condition
            engine = await create_protocol_engine(self._hardware_api)
            self._default_engine = engine

        return engine

    async def create(
        self,
        run_id: str,
        labware_offsets: List[LabwareOffsetCreate],
        protocol: Optional[ProtocolResource],
    ) -> StateSummary:
        """Create and store a ProtocolRunner and ProtocolEngine for a given Run.

        Args:
            run_id: The run resource the engine is assigned to.
            labware_offsets: Labware offsets to create the engine with.
            protocol: The protocol to load the runner with, if any.

        Returns:
            The initial equipment and status summary of the engine.

        Raises:
            EngineConflictError: The current runner/engine pair is not idle, so
            a new set may not be created.
        """
        engine = await create_protocol_engine(hardware_api=self._hardware_api)
        runner = ProtocolRunner(protocol_engine=engine, hardware_api=self._hardware_api)

        if self._runner_engine_pair is not None:
            raise EngineConflictError("Another run is currently active.")

        if protocol is not None:
            runner.load(protocol.source)

        for offset in labware_offsets:
            engine.add_labware_offset(offset)

        self._runner_engine_pair = RunnerEnginePair(
            run_id=run_id,
            runner=runner,
            engine=engine,
        )

        return engine.state_view.get_summary()

    async def clear(self) -> ProtocolRunResult:
        """Remove the persisted ProtocolEngine.

        Raises:
            EngineConflictError: The current runner/engine pair is not idle, so
            they cannot be cleared.
        """
        engine = self.engine
        state_view = engine.state_view

        if state_view.commands.get_is_okay_to_clear():
            await engine.finish(drop_tips_and_home=False, set_run_status=False)
        else:
            raise EngineConflictError("Current run is not idle or stopped.")

        run_data = state_view.get_summary()
        commands = state_view.commands.get_all()
        self._runner_engine_pair = None

        return ProtocolRunResult(state_summary=run_data, commands=commands)
