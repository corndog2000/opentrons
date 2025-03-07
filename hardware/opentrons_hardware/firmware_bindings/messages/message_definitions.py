"""Definition of CAN messages."""
from dataclasses import dataclass
from typing import Type

from typing_extensions import Literal

from ..constants import MessageId
from . import payloads


@dataclass
class EmptyPayloadMessage:
    """Base class of a message that has an empty payload."""

    payload: payloads.EmptyPayload = payloads.EmptyPayload()
    payload_type: Type[payloads.EmptyPayload] = payloads.EmptyPayload


@dataclass
class HeartbeatRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[MessageId.heartbeat_request] = MessageId.heartbeat_request


@dataclass
class HeartbeatResponse(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[MessageId.heartbeat_response] = MessageId.heartbeat_response


@dataclass
class DeviceInfoRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[MessageId.device_info_request] = MessageId.device_info_request


@dataclass
class DeviceInfoResponse:  # noqa: D101
    payload: payloads.DeviceInfoResponsePayload
    payload_type: Type[
        payloads.DeviceInfoResponsePayload
    ] = payloads.DeviceInfoResponsePayload
    message_id: Literal[MessageId.device_info_response] = MessageId.device_info_response


@dataclass
class TaskInfoRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[MessageId.task_info_request] = MessageId.task_info_request


@dataclass
class TaskInfoResponse:  # noqa: D101
    payload: payloads.TaskInfoResponsePayload
    payload_type: Type[
        payloads.TaskInfoResponsePayload
    ] = payloads.TaskInfoResponsePayload
    message_id: Literal[MessageId.task_info_response] = MessageId.task_info_response


@dataclass
class StopRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[MessageId.stop_request] = MessageId.stop_request


@dataclass
class GetStatusRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[MessageId.get_status_request] = MessageId.get_status_request


@dataclass
class EnableMotorRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[MessageId.enable_motor_request] = MessageId.enable_motor_request


@dataclass
class DisableMotorRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[
        MessageId.disable_motor_request
    ] = MessageId.disable_motor_request


@dataclass
class GetStatusResponse:  # noqa: D101
    payload: payloads.GetStatusResponsePayload
    payload_type: Type[
        payloads.GetStatusResponsePayload
    ] = payloads.GetStatusResponsePayload
    message_id: Literal[MessageId.get_status_response] = MessageId.get_status_response


@dataclass
class MoveRequest:  # noqa: D101
    payload: payloads.MoveRequestPayload
    payload_type: Type[payloads.MoveRequestPayload] = payloads.MoveRequestPayload
    message_id: Literal[MessageId.move_request] = MessageId.move_request


@dataclass
class SetupRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[MessageId.setup_request] = MessageId.setup_request


@dataclass
class WriteToEEPromRequest:  # noqa: D101
    payload: payloads.EEPromDataPayload
    payload_type: Type[payloads.EEPromDataPayload] = payloads.EEPromDataPayload
    message_id: Literal[MessageId.write_eeprom] = MessageId.write_eeprom


@dataclass
class ReadFromEEPromRequest:  # noqa: D101
    payload: payloads.EEPromReadPayload
    payload_type: Type[payloads.EEPromReadPayload] = payloads.EEPromReadPayload
    message_id: Literal[MessageId.read_eeprom_request] = MessageId.read_eeprom_request


@dataclass
class ReadFromEEPromResponse:  # noqa: D101
    payload: payloads.EEPromDataPayload
    payload_type: Type[payloads.EEPromDataPayload] = payloads.EEPromDataPayload
    message_id: Literal[MessageId.read_eeprom_response] = MessageId.read_eeprom_response


@dataclass
class AddLinearMoveRequest:  # noqa: D101
    payload: payloads.AddLinearMoveRequestPayload
    payload_type: Type[
        payloads.AddLinearMoveRequestPayload
    ] = payloads.AddLinearMoveRequestPayload
    message_id: Literal[MessageId.add_move_request] = MessageId.add_move_request


@dataclass
class GetMoveGroupRequest:  # noqa: D101
    payload: payloads.MoveGroupRequestPayload
    payload_type: Type[
        payloads.MoveGroupRequestPayload
    ] = payloads.MoveGroupRequestPayload
    message_id: Literal[
        MessageId.get_move_group_request
    ] = MessageId.get_move_group_request


@dataclass
class GetMoveGroupResponse:  # noqa: D101
    payload: payloads.GetMoveGroupResponsePayload
    payload_type: Type[
        payloads.GetMoveGroupResponsePayload
    ] = payloads.GetMoveGroupResponsePayload
    message_id: Literal[
        MessageId.get_move_group_response
    ] = MessageId.get_move_group_response


@dataclass
class ExecuteMoveGroupRequest:  # noqa: D101
    payload: payloads.ExecuteMoveGroupRequestPayload
    payload_type: Type[
        payloads.ExecuteMoveGroupRequestPayload
    ] = payloads.ExecuteMoveGroupRequestPayload
    message_id: Literal[
        MessageId.execute_move_group_request
    ] = MessageId.execute_move_group_request


@dataclass
class ClearAllMoveGroupsRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[
        MessageId.clear_all_move_groups_request
    ] = MessageId.clear_all_move_groups_request


@dataclass
class MoveCompleted:  # noqa: D101
    payload: payloads.MoveCompletedPayload
    payload_type: Type[payloads.MoveCompletedPayload] = payloads.MoveCompletedPayload
    message_id: Literal[MessageId.move_completed] = MessageId.move_completed


@dataclass
class SetMotionConstraints:  # noqa: D101
    payload: payloads.MotionConstraintsPayload
    payload_type: Type[
        payloads.MotionConstraintsPayload
    ] = payloads.MotionConstraintsPayload
    message_id: Literal[
        MessageId.set_motion_constraints
    ] = MessageId.set_motion_constraints


@dataclass
class GetMotionConstraintsRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[
        MessageId.get_motion_constraints_request
    ] = MessageId.get_motion_constraints_request


@dataclass
class GetMotionConstraintsResponse:  # noqa: D101
    payload: payloads.MotionConstraintsPayload
    payload_type: Type[
        payloads.MotionConstraintsPayload
    ] = payloads.MotionConstraintsPayload
    message_id: Literal[
        MessageId.get_motion_constraints_response
    ] = MessageId.get_motion_constraints_response


@dataclass
class WriteMotorDriverRegister:  # noqa: D101
    payload: payloads.MotorDriverRegisterDataPayload
    payload_type: Type[
        payloads.MotorDriverRegisterPayload
    ] = payloads.MotorDriverRegisterDataPayload
    message_id: Literal[
        MessageId.write_motor_driver_register_request
    ] = MessageId.write_motor_driver_register_request


@dataclass
class ReadMotorDriverRequest:  # noqa: D101
    payload: payloads.MotorDriverRegisterPayload
    payload_type: Type[
        payloads.MotorDriverRegisterPayload
    ] = payloads.MotorDriverRegisterPayload
    message_id: Literal[
        MessageId.read_motor_driver_register_request
    ] = MessageId.read_motor_driver_register_request


@dataclass
class ReadMotorDriverResponse:  # noqa: D101
    payload: payloads.ReadMotorDriverRegisterResponsePayload
    payload_type: Type[
        payloads.ReadMotorDriverRegisterResponsePayload
    ] = payloads.ReadMotorDriverRegisterResponsePayload
    message_id: Literal[
        MessageId.read_motor_driver_register_response
    ] = MessageId.read_motor_driver_register_response


@dataclass
class WriteMotorCurrentRequest:  # noqa: D101
    payload: payloads.MotorCurrentPayload
    payload_type: Type[payloads.MotorCurrentPayload] = payloads.MotorCurrentPayload
    message_id: Literal[
        MessageId.write_motor_current_request
    ] = MessageId.write_motor_current_request


@dataclass
class ReadPresenceSensingVoltageRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[
        MessageId.read_presence_sensing_voltage_request
    ] = MessageId.read_presence_sensing_voltage_request


@dataclass
class ReadPresenceSensingVoltageResponse:  # noqa: D101
    payload: payloads.ReadPresenceSensingVoltageResponsePayload
    payload_type: Type[
        payloads.ReadPresenceSensingVoltageResponsePayload
    ] = payloads.ReadPresenceSensingVoltageResponsePayload
    message_id: Literal[
        MessageId.read_presence_sensing_voltage_response
    ] = MessageId.read_presence_sensing_voltage_response


@dataclass
class PushToolsDetectedNotification:  # noqa: D101
    payload: payloads.ToolsDetectedNotificationPayload
    payload_type: Type[
        payloads.ToolsDetectedNotificationPayload
    ] = payloads.ToolsDetectedNotificationPayload
    message_id: Literal[
        MessageId.tools_detected_notification
    ] = MessageId.tools_detected_notification


@dataclass
class AttachedToolsRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[
        MessageId.attached_tools_request
    ] = MessageId.attached_tools_request


@dataclass
class FirmwareUpdateInitiate(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[MessageId.fw_update_initiate] = MessageId.fw_update_initiate


@dataclass
class FirmwareUpdateData:  # noqa: D101
    payload: payloads.FirmwareUpdateData
    payload_type: Type[payloads.FirmwareUpdateData] = payloads.FirmwareUpdateData
    message_id: Literal[MessageId.fw_update_data] = MessageId.fw_update_data


@dataclass
class FirmwareUpdateDataAcknowledge:  # noqa: D101
    payload: payloads.FirmwareUpdateDataAcknowledge
    payload_type: Type[
        payloads.FirmwareUpdateDataAcknowledge
    ] = payloads.FirmwareUpdateDataAcknowledge
    message_id: Literal[MessageId.fw_update_data_ack] = MessageId.fw_update_data_ack


@dataclass
class FirmwareUpdateComplete:  # noqa: D101
    payload: payloads.FirmwareUpdateComplete
    payload_type: Type[
        payloads.FirmwareUpdateComplete
    ] = payloads.FirmwareUpdateComplete
    message_id: Literal[MessageId.fw_update_complete] = MessageId.fw_update_complete


@dataclass
class FirmwareUpdateCompleteAcknowledge:  # noqa: D101
    payload: payloads.FirmwareUpdateAcknowledge
    payload_type: Type[
        payloads.FirmwareUpdateAcknowledge
    ] = payloads.FirmwareUpdateAcknowledge
    message_id: Literal[
        MessageId.fw_update_complete_ack
    ] = MessageId.fw_update_complete_ack


@dataclass
class FirmwareUpdateStatusRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[
        MessageId.fw_update_status_request
    ] = MessageId.fw_update_status_request


@dataclass
class FirmwareUpdateStatusResponse:  # noqa: D101
    payload: payloads.FirmwareUpdateStatus
    payload_type: Type[payloads.FirmwareUpdateStatus] = payloads.FirmwareUpdateStatus
    message_id: Literal[
        MessageId.fw_update_status_response
    ] = MessageId.fw_update_status_response


@dataclass
class FirmwareUpdateEraseAppRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[MessageId.fw_update_erase_app] = MessageId.fw_update_erase_app


@dataclass
class FirmwareUpdateEraseAppResponse:  # noqa: D101
    payload: payloads.FirmwareUpdateAcknowledge
    payload_type: Type[
        payloads.FirmwareUpdateAcknowledge
    ] = payloads.FirmwareUpdateAcknowledge
    message_id: Literal[
        MessageId.fw_update_erase_app_ack
    ] = MessageId.fw_update_erase_app_ack


@dataclass
class HomeRequest:  # noqa: D101
    payload: payloads.HomeRequestPayload
    payload_type: Type[payloads.HomeRequestPayload] = payloads.HomeRequestPayload
    message_id: Literal[MessageId.home_request] = MessageId.home_request


@dataclass
class FirmwareUpdateStartApp(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[MessageId.fw_update_start_app] = MessageId.fw_update_start_app


@dataclass
class ReadLimitSwitchRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[MessageId.limit_sw_request] = MessageId.limit_sw_request


@dataclass
class ReadLimitSwitchResponse:  # noqa: D101
    payload: payloads.GetLimitSwitchResponse
    payload_type: Type[
        payloads.GetLimitSwitchResponse
    ] = payloads.GetLimitSwitchResponse
    message_id: Literal[MessageId.limit_sw_response] = MessageId.limit_sw_response


@dataclass
class ReadFromSensorRequest:  # noqa: D101
    payload: payloads.ReadFromSensorRequestPayload
    payload_type: Type[
        payloads.ReadFromSensorRequestPayload
    ] = payloads.ReadFromSensorRequestPayload
    message_id: Literal[MessageId.read_sensor_request] = MessageId.read_sensor_request


@dataclass
class WriteToSensorRequest:  # noqa: D101
    payload: payloads.WriteToSensorRequestPayload
    payload_type: Type[
        payloads.WriteToSensorRequestPayload
    ] = payloads.WriteToSensorRequestPayload
    message_id: Literal[MessageId.write_sensor_request] = MessageId.write_sensor_request


@dataclass
class BaselineSensorRequest:  # noqa: D101
    payload: payloads.BaselineSensorRequestPayload
    payload_type: Type[
        payloads.BaselineSensorRequestPayload
    ] = payloads.BaselineSensorRequestPayload
    message_id: Literal[
        MessageId.baseline_sensor_request
    ] = MessageId.baseline_sensor_request


@dataclass
class ReadFromSensorResponse:  # noqa: D101
    payload: payloads.ReadFromSensorResponsePayload
    payload_type: Type[
        payloads.ReadFromSensorResponsePayload
    ] = payloads.ReadFromSensorResponsePayload
    message_id: Literal[MessageId.read_sensor_response] = MessageId.read_sensor_response


@dataclass
class SetSensorThresholdRequest:  # noqa: D101
    payload: payloads.SetSensorThresholdRequestPayload
    payload_type: Type[
        payloads.SetSensorThresholdRequestPayload
    ] = payloads.SetSensorThresholdRequestPayload
    message_id: Literal[
        MessageId.set_sensor_threshold_request
    ] = MessageId.set_sensor_threshold_request


@dataclass
class SensorThresholdResponse:  # noqa: D101
    payload: payloads.SensorThresholdResponsePayload
    payload_type: Type[
        payloads.SensorThresholdResponsePayload
    ] = payloads.SensorThresholdResponsePayload
    message_id: Literal[
        MessageId.set_sensor_threshold_response
    ] = MessageId.set_sensor_threshold_response


@dataclass
class SensorDiagnosticRequest:  # noqa: D101
    payload: payloads.SensorDiagnosticRequestPayload
    payload_type: Type[
        payloads.SensorDiagnosticRequestPayload
    ] = payloads.SensorDiagnosticRequestPayload
    message_id: Literal[
        MessageId.sensor_diagnostic_request
    ] = MessageId.sensor_diagnostic_request


@dataclass
class SensorDiagnosticResponse:  # noqa: D101
    payload: payloads.SensorDiagnosticResponsePayload
    payload_type: Type[
        payloads.SensorDiagnosticResponsePayload
    ] = payloads.SensorDiagnosticResponsePayload
    message_id: Literal[
        MessageId.sensor_diagnostic_response
    ] = MessageId.sensor_diagnostic_response


@dataclass
class PipetteInfoRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[MessageId.pipette_info_request] = MessageId.pipette_info_request


@dataclass
class PipetteInfoResponse:  # noqa: D101
    payload: payloads.PipetteInfoResponsePayload
    payload_type: Type[
        payloads.PipetteInfoResponsePayload
    ] = payloads.PipetteInfoResponsePayload
    message_id: Literal[
        MessageId.pipette_info_response
    ] = MessageId.pipette_info_response


@dataclass
class SetBrushedMotorVrefRequest:  # noqa: D101
    payload: payloads.BrushedMotorVrefPayload
    payload_type: Type[
        payloads.BrushedMotorVrefPayload
    ] = payloads.BrushedMotorVrefPayload
    message_id: Literal[
        MessageId.set_brushed_motor_vref_request
    ] = MessageId.set_brushed_motor_vref_request


@dataclass
class SetBrushedMotorPwmRequest:  # noqa: D101
    payload: payloads.BrushedMotorPwmPayload
    payload_type: Type[
        payloads.BrushedMotorPwmPayload
    ] = payloads.BrushedMotorPwmPayload
    message_id: Literal[
        MessageId.set_brushed_motor_pwm_request
    ] = MessageId.set_brushed_motor_pwm_request


@dataclass
class GripperGripRequest:  # noqa: D101
    payload: payloads.GripperMoveRequestPayload
    payload_type: Type[
        payloads.GripperMoveRequestPayload
    ] = payloads.GripperMoveRequestPayload
    message_id: Literal[MessageId.gripper_grip_request] = MessageId.gripper_grip_request


@dataclass
class GripperHomeRequest:  # noqa: D101
    payload: payloads.GripperMoveRequestPayload
    payload_type: Type[
        payloads.GripperMoveRequestPayload
    ] = payloads.GripperMoveRequestPayload
    message_id: Literal[MessageId.gripper_home_request] = MessageId.gripper_home_request


@dataclass
class BindSensorOutputRequest:  # noqa: D101
    payload: payloads.BindSensorOutputRequestPayload
    payload_type: Type[
        payloads.BindSensorOutputRequestPayload
    ] = payloads.BindSensorOutputRequestPayload
    message_id: Literal[
        MessageId.bind_sensor_output_request
    ] = MessageId.bind_sensor_output_request


@dataclass
class BindSensorOutputResponse:  # noqa: D101
    payload: payloads.BindSensorOutputResponsePayload
    payload_type: Type[
        payloads.BindSensorOutputResponsePayload
    ] = payloads.BindSensorOutputResponsePayload
    message_id: Literal[
        MessageId.bind_sensor_output_response
    ] = MessageId.bind_sensor_output_response


@dataclass
class GripperInfoRequest(EmptyPayloadMessage):  # noqa: D101
    message_id: Literal[MessageId.gripper_info_request] = MessageId.gripper_info_request


@dataclass
class GripperInfoResponse:  # noqa: D101
    payload: payloads.GripperInfoResponsePayload
    payload_type: Type[
        payloads.GripperInfoResponsePayload
    ] = payloads.GripperInfoResponsePayload
    message_id: Literal[
        MessageId.gripper_info_response
    ] = MessageId.gripper_info_response


@dataclass
class TipActionRequest:  # noqa: D101
    payload: payloads.TipActionRequestPayload
    payload_type: Type[
        payloads.TipActionRequestPayload
    ] = payloads.TipActionRequestPayload
    message_id: Literal[
        MessageId.do_self_contained_tip_action_request
    ] = MessageId.do_self_contained_tip_action_request


@dataclass
class TipActionResponse:  # noqa: D101
    payload: payloads.TipActionResponsePayload
    payload_type: Type[
        payloads.TipActionResponsePayload
    ] = payloads.TipActionResponsePayload
    message_id: Literal[
        MessageId.do_self_contained_tip_action_response
    ] = MessageId.do_self_contained_tip_action_response


@dataclass
class PeripheralStatusRequest:  # noqa: D101
    payload: payloads.PeripheralStatusRequestPayload
    payload_type: Type[
        payloads.PeripheralStatusRequestPayload
    ] = payloads.PeripheralStatusRequestPayload
    message_id: Literal[
        MessageId.peripheral_status_request
    ] = MessageId.peripheral_status_request


@dataclass
class PeripheralStatusResponse:  # noqa: D101
    payload: payloads.PeripheralStatusResponsePayload
    payload_type: Type[
        payloads.PeripheralStatusResponsePayload
    ] = payloads.PeripheralStatusResponsePayload
    message_id: Literal[
        MessageId.peripheral_status_response
    ] = MessageId.peripheral_status_response
