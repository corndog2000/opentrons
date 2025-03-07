"""Tests for robot_server.modules.module_data_mapper."""
import pytest

from opentrons.protocol_engine import ModuleModel
from opentrons.drivers.rpi_drivers.types import USBPort as HardwareUSBPort
from opentrons.hardware_control.modules import (
    LiveData,
    ModuleType,
    MagneticStatus,
    TemperatureStatus,
    HeaterShakerStatus,
)


from robot_server.modules.module_identifier import ModuleIdentity
from robot_server.modules.module_data_mapper import ModuleDataMapper

from robot_server.modules.module_models import (
    UsbPort,
    MagneticModule,
    MagneticModuleData,
    TemperatureModule,
    TemperatureModuleData,
    ThermocyclerModule,
    ThermocyclerModuleData,
    HeaterShakerModule,
    HeaterShakerModuleData,
)


@pytest.mark.parametrize(
    "input_model",
    ["magneticModuleV1", "magneticModuleV2"],
)
@pytest.mark.parametrize(
    "input_data",
    [
        {"status": "engaged", "data": {"engaged": True, "height": 42}},
        {"status": "disengaged", "data": {"engaged": False, "height": 0.0}},
    ],
)
def test_maps_magnetic_module_data(input_model: str, input_data: LiveData) -> None:
    """It should map hardware data to a magnetic module."""
    module_identity = ModuleIdentity(
        module_id="module-id",
        serial_number="serial-number",
        firmware_version="1.2.3",
        hardware_revision="4.5.6",
    )

    hardware_usb_port = HardwareUSBPort(
        name="abc",
        port_number=101,
        hub=202,
        device_path="/dev/null",
    )

    subject = ModuleDataMapper()
    result = subject.map_data(
        model=input_model,
        module_identity=module_identity,
        has_available_update=True,
        live_data=input_data,
        usb_port=hardware_usb_port,
    )

    assert result == MagneticModule(
        id="module-id",
        serialNumber="serial-number",
        firmwareVersion="1.2.3",
        hardwareRevision="4.5.6",
        hasAvailableUpdate=True,
        moduleType=ModuleType.MAGNETIC,
        moduleModel=ModuleModel(input_model),  # type: ignore[arg-type]
        usbPort=UsbPort(port=101, hub=202, path="/dev/null"),
        data=MagneticModuleData(
            status=MagneticStatus(input_data["status"]),
            engaged=input_data["data"]["engaged"],  # type: ignore[arg-type]
            height=input_data["data"]["height"],  # type: ignore[arg-type]
        ),
    )


@pytest.mark.parametrize(
    "input_model",
    ["temperatureModuleV1", "temperatureModuleV2"],
)
@pytest.mark.parametrize(
    "input_data",
    [
        {"status": "idle", "data": {"currentTemp": 42.0, "targetTemp": None}},
        {
            "status": "holding at target",
            "data": {"currentTemp": 84.0, "targetTemp": 84.0},
        },
    ],
)
def test_maps_temperature_module_data(input_model: str, input_data: LiveData) -> None:
    """It should map hardware data to a magnetic module."""
    module_identity = ModuleIdentity(
        module_id="module-id",
        serial_number="serial-number",
        firmware_version="1.2.3",
        hardware_revision="4.5.6",
    )

    hardware_usb_port = HardwareUSBPort(
        name="abc",
        port_number=101,
        hub=202,
        device_path="/dev/null",
    )

    subject = ModuleDataMapper()
    result = subject.map_data(
        model=input_model,
        module_identity=module_identity,
        has_available_update=True,
        live_data=input_data,
        usb_port=hardware_usb_port,
    )

    assert result == TemperatureModule(
        id="module-id",
        serialNumber="serial-number",
        firmwareVersion="1.2.3",
        hardwareRevision="4.5.6",
        hasAvailableUpdate=True,
        moduleType=ModuleType.TEMPERATURE,
        moduleModel=ModuleModel(input_model),  # type: ignore[arg-type]
        usbPort=UsbPort(port=101, hub=202, path="/dev/null"),
        data=TemperatureModuleData(
            status=TemperatureStatus(input_data["status"]),
            currentTemperature=input_data["data"]["currentTemp"],  # type: ignore[arg-type]  # noqa: E501
            targetTemperature=input_data["data"]["targetTemp"],  # type: ignore[arg-type]   # noqa: E501
        ),
    )


@pytest.mark.parametrize(
    "input_model",
    ["thermocyclerModuleV1"],
)
@pytest.mark.parametrize(
    "input_data",
    [
        {
            "status": "idle",
            "data": {
                "lid": "open",
                "lidTarget": None,
                "lidTemp": None,
                "currentTemp": None,
                "targetTemp": None,
                "holdTime": None,
                "rampRate": None,
                "currentCycleIndex": None,
                "totalCycleCount": None,
                "currentStepIndex": None,
                "totalStepCount": None,
            },
        },
        {
            "status": "heating",
            "data": {
                "lid": "open",
                "lidTarget": 1,
                "lidTemp": 2,
                "currentTemp": 3,
                "targetTemp": 4,
                "holdTime": 5,
                "rampRate": 6,
                "currentCycleIndex": 7,
                "totalCycleCount": 8,
                "currentStepIndex": 9,
                "totalStepCount": 10,
            },
        },
    ],
)
def test_maps_thermocycler_module_data(input_model: str, input_data: LiveData) -> None:
    """It should map hardware data to a magnetic module."""
    module_identity = ModuleIdentity(
        module_id="module-id",
        serial_number="serial-number",
        firmware_version="1.2.3",
        hardware_revision="4.5.6",
    )

    hardware_usb_port = HardwareUSBPort(
        name="abc",
        port_number=101,
        hub=202,
        device_path="/dev/null",
    )

    subject = ModuleDataMapper()
    result = subject.map_data(
        model=input_model,
        module_identity=module_identity,
        has_available_update=True,
        live_data=input_data,
        usb_port=hardware_usb_port,
    )

    assert result == ThermocyclerModule(
        id="module-id",
        serialNumber="serial-number",
        firmwareVersion="1.2.3",
        hardwareRevision="4.5.6",
        hasAvailableUpdate=True,
        moduleType=ModuleType.THERMOCYCLER,
        moduleModel=ModuleModel(input_model),  # type: ignore[arg-type]
        usbPort=UsbPort(port=101, hub=202, path="/dev/null"),
        data=ThermocyclerModuleData(
            status=TemperatureStatus(input_data["status"]),
            currentTemperature=input_data["data"]["currentTemp"],  # type: ignore[arg-type]  # noqa: E501
            targetTemperature=input_data["data"]["targetTemp"],  # type: ignore[arg-type]   # noqa: E501
            lidStatus=input_data["data"]["lid"],  # type: ignore[arg-type]
            lidTemperature=input_data["data"]["lidTemp"],  # type: ignore[arg-type]
            lidTargetTemperature=input_data["data"]["lidTarget"],  # type: ignore[arg-type]  # noqa: E501
            holdTime=input_data["data"]["holdTime"],  # type: ignore[arg-type]
            rampRate=input_data["data"]["rampRate"],  # type: ignore[arg-type]
            currentCycleIndex=input_data["data"]["currentCycleIndex"],  # type: ignore[arg-type]  # noqa: E501
            totalCycleCount=input_data["data"]["totalCycleCount"],  # type: ignore[arg-type]  # noqa: E501
            currentStepIndex=input_data["data"]["currentStepIndex"],  # type: ignore[arg-type]  # noqa: E501
            totalStepCount=input_data["data"]["totalStepCount"],  # type: ignore[arg-type]  # noqa: E501
        ),
    )


@pytest.mark.parametrize(
    "input_model",
    ["heaterShakerModuleV1"],
)
@pytest.mark.parametrize(
    "input_data",
    [
        {
            "status": "idle",
            "data": {
                "temperatureStatus": "idle",
                "speedStatus": "idle",
                "labwareLatchStatus": "idle_open",
                "currentTemp": 42,
                "targetTemp": None,
                "currentSpeed": 1337,
                "targetSpeed": None,
                "errorDetails": None,
            },
        },
        {
            "status": "running",
            "data": {
                "temperatureStatus": "heating",
                "speedStatus": "speeding up",
                "labwareLatchStatus": "idle_closed",
                "currentTemp": 42,
                "targetTemp": 84,
                "currentSpeed": 1337,
                "targetSpeed": 9001,
                "errorDetails": "oh no",
            },
        },
    ],
)
def test_maps_heater_shaker_module_data(input_model: str, input_data: LiveData) -> None:
    """It should map hardware data to a magnetic module."""
    module_identity = ModuleIdentity(
        module_id="module-id",
        serial_number="serial-number",
        firmware_version="1.2.3",
        hardware_revision="4.5.6",
    )

    hardware_usb_port = HardwareUSBPort(
        name="abc",
        port_number=101,
        hub=202,
        device_path="/dev/null",
    )

    subject = ModuleDataMapper()
    result = subject.map_data(
        model=input_model,
        module_identity=module_identity,
        has_available_update=True,
        live_data=input_data,
        usb_port=hardware_usb_port,
    )

    assert result == HeaterShakerModule(
        id="module-id",
        serialNumber="serial-number",
        firmwareVersion="1.2.3",
        hardwareRevision="4.5.6",
        hasAvailableUpdate=True,
        moduleType=ModuleType.HEATER_SHAKER,
        moduleModel=ModuleModel(input_model),  # type: ignore[arg-type]
        usbPort=UsbPort(port=101, hub=202, path="/dev/null"),
        data=HeaterShakerModuleData(
            status=HeaterShakerStatus(input_data["status"]),
            labwareLatchStatus=input_data["data"]["labwareLatchStatus"],  # type: ignore[arg-type]  # noqa: E501
            speedStatus=input_data["data"]["speedStatus"],  # type: ignore[arg-type]
            currentSpeed=input_data["data"]["currentSpeed"],  # type: ignore[arg-type]
            targetSpeed=input_data["data"]["targetSpeed"],  # type: ignore[arg-type]
            temperatureStatus=input_data["data"]["temperatureStatus"],  # type: ignore[arg-type]  # noqa: E501
            currentTemperature=input_data["data"]["currentTemp"],  # type: ignore[arg-type]  # noqa: E501
            targetTemperature=input_data["data"]["targetTemp"],  # type: ignore[arg-type]  # noqa: E501
            errorDetails=input_data["data"]["errorDetails"],  # type: ignore[arg-type]
        ),
    )
