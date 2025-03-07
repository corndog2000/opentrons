"""Command models to wait for target temperature of a Temperature Module."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler

WaitForTemperatureCommandType = Literal["temperatureModule/waitForTemperature"]


class WaitForTemperatureParams(BaseModel):
    """Input parameters to wait for a Temperature Module's target temperature."""

    moduleId: str = Field(..., description="Unique ID of the Temperature Module.")


class WaitForTemperatureResult(BaseModel):
    """Result data from waiting for a Temperature Module's target temperature."""


class WaitForTemperatureImpl(
    AbstractCommandImpl[WaitForTemperatureParams, WaitForTemperatureResult]
):
    """Execution implementation of Temperature Module's wait for temperature command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(
        self, params: WaitForTemperatureParams
    ) -> WaitForTemperatureResult:
        """Wait for a Temperature Module's target temperature."""
        # Allow propagation of ModuleNotLoadedError and WrongModuleTypeError.
        module_substate = self._state_view.modules.get_temperature_module_substate(
            module_id=params.moduleId
        )

        # Raises error if no target temperature
        target_temp = module_substate.get_plate_target_temperature()

        # Allow propagation of ModuleNotAttachedError.
        temp_hardware_module = self._equipment.get_module_hardware_api(
            module_substate.module_id
        )

        if temp_hardware_module is not None:
            await temp_hardware_module.await_temperature(
                awaiting_temperature=target_temp
            )
        return WaitForTemperatureResult()


class WaitForTemperature(
    BaseCommand[WaitForTemperatureParams, WaitForTemperatureResult]
):
    """A command to wait for a Temperature Module's target temperature."""

    commandType: WaitForTemperatureCommandType = "temperatureModule/waitForTemperature"
    params: WaitForTemperatureParams
    result: Optional[WaitForTemperatureResult]

    _ImplementationCls: Type[WaitForTemperatureImpl] = WaitForTemperatureImpl


class WaitForTemperatureCreate(BaseCommandCreate[WaitForTemperatureParams]):
    """A request to create a Temperature Module's wait for temperature command."""

    commandType: WaitForTemperatureCommandType
    params: WaitForTemperatureParams

    _CommandCls: Type[WaitForTemperature] = WaitForTemperature
