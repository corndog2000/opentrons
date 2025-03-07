"""Module identification and response data mapping."""
from typing import Type, cast

from opentrons.hardware_control.modules import (
    LiveData,
    ModuleType,
    MagneticStatus,
    TemperatureStatus,
    HeaterShakerStatus,
    SpeedStatus,
)
from opentrons.drivers.types import (
    ThermocyclerLidStatus,
    HeaterShakerLabwareLatchStatus,
)
from opentrons.drivers.rpi_drivers.types import USBPort as HardwareUSBPort

from opentrons.protocol_engine import ModuleModel

from .module_identifier import ModuleIdentity
from .module_models import (
    AttachedModule,
    AttachedModuleData,
    MagneticModule,
    MagneticModuleData,
    TemperatureModule,
    TemperatureModuleData,
    ThermocyclerModule,
    ThermocyclerModuleData,
    HeaterShakerModule,
    HeaterShakerModuleData,
    UsbPort,
)


class ModuleDataMapper:
    """Map hardware control modules to module response."""

    def map_data(
        self,
        model: str,
        module_identity: ModuleIdentity,
        has_available_update: bool,
        live_data: LiveData,
        usb_port: HardwareUSBPort,
    ) -> AttachedModule:
        """Map hardware control data to an attached module response."""
        module_model = ModuleModel(model)
        module_type = module_model.as_type()

        module_cls: Type[AttachedModule]
        module_data: AttachedModuleData

        # rely on Pydantic to check/coerce data fields from dicts at run time
        if module_type == ModuleType.MAGNETIC:
            module_cls = MagneticModule
            module_data = MagneticModuleData(
                status=MagneticStatus(live_data["status"]),
                engaged=cast(bool, live_data["data"].get("engaged")),
                height=cast(float, live_data["data"].get("height")),
            )

        elif module_type == ModuleType.TEMPERATURE:
            module_cls = TemperatureModule
            module_data = TemperatureModuleData(
                status=TemperatureStatus(live_data["status"]),
                targetTemperature=cast(float, live_data["data"].get("targetTemp")),
                currentTemperature=cast(float, live_data["data"].get("currentTemp")),
            )

        elif module_type == ModuleType.THERMOCYCLER:
            module_cls = ThermocyclerModule
            module_data = ThermocyclerModuleData(
                status=TemperatureStatus(live_data["status"]),
                targetTemperature=cast(float, live_data["data"].get("targetTemp")),
                currentTemperature=cast(float, live_data["data"].get("currentTemp")),
                lidStatus=cast(ThermocyclerLidStatus, live_data["data"].get("lid")),
                lidTemperature=cast(float, live_data["data"].get("lidTemp")),
                lidTargetTemperature=cast(float, live_data["data"].get("lidTarget")),
                holdTime=cast(float, live_data["data"].get("holdTime")),
                rampRate=cast(float, live_data["data"].get("rampRate")),
                currentCycleIndex=cast(int, live_data["data"].get("currentCycleIndex")),
                totalCycleCount=cast(int, live_data["data"].get("totalCycleCount")),
                currentStepIndex=cast(int, live_data["data"].get("currentStepIndex")),
                totalStepCount=cast(int, live_data["data"].get("totalStepCount")),
            )

        elif module_type == ModuleType.HEATER_SHAKER:
            module_cls = HeaterShakerModule
            module_data = HeaterShakerModuleData(
                status=HeaterShakerStatus(live_data["status"]),
                labwareLatchStatus=cast(
                    HeaterShakerLabwareLatchStatus,
                    live_data["data"].get("labwareLatchStatus"),
                ),
                speedStatus=cast(SpeedStatus, live_data["data"].get("speedStatus")),
                currentSpeed=cast(int, live_data["data"].get("currentSpeed")),
                targetSpeed=cast(int, live_data["data"].get("targetSpeed")),
                temperatureStatus=cast(
                    TemperatureStatus, live_data["data"].get("temperatureStatus")
                ),
                currentTemperature=cast(float, live_data["data"].get("currentTemp")),
                targetTemperature=cast(float, live_data["data"].get("targetTemp")),
                errorDetails=cast(str, live_data["data"].get("errorDetails")),
            )
        else:
            assert False, f"Invalid module type {module_type}"

        return module_cls(
            id=module_identity.module_id,
            serialNumber=module_identity.serial_number,
            firmwareVersion=module_identity.firmware_version,
            hardwareRevision=module_identity.hardware_revision,
            hasAvailableUpdate=has_available_update,
            usbPort=UsbPort(
                port=usb_port.port_number,
                hub=usb_port.hub,
                path=usb_port.device_path,
            ),
            # types of below fields are already checked at runtime
            moduleType=module_type,  # type: ignore[arg-type]
            moduleModel=module_model,  # type: ignore[arg-type]
            data=module_data,  # type: ignore[arg-type]
        )
