import {
  TEMPDECK,
  MAGDECK,
  THERMOCYCLER,
  ModuleType,
} from '@opentrons/shared-data'

import type {
  MagneticModuleModel,
  TemperatureModuleModel,
  ThermocyclerModuleModel,
  HeaterShakerModuleModel,
  ModuleModel,
} from '@opentrons/shared-data'

interface PhysicalPort {
  path: string | null
  port: number | null
  hub: number | null
}

export interface ApiBaseModule {
  id: string
  serialNumber: string
  hardwareRevision: string
  moduleModel: ModuleModel
  moduleType: ModuleType
  firmwareVersion: string
  hasAvailableUpdate: boolean
  usbPort: PhysicalPort
}

interface ApiBaseModuleLegacy {
  serialNumber: string
  moduleModel: string
  firmwareVersion: string
  usbPort: string
  hasAvailableUpdate: boolean
}

export interface TemperatureData {
  currentTemperature: number
  targetTemperature: number | null
  status: TemperatureStatus
}

export interface MagneticData {
  engaged: boolean
  height: number
  status: MagneticStatus
}

export interface ThermocyclerData {
  // TODO(mc, 2019-12-12): in_between comes from the thermocycler firmware and
  // will be rare in normal operation due to limitations in current revision
  lidStatus: 'open' | 'closed' | 'in_between'
  lidTargetTemperature: number | null
  lidTemperature: number | null
  currentTemperature: number | null
  targetTemperature: number | null
  holdTime: number | null
  rampRate: number | null
  totalStepCount: number | null
  currentStepIndex: number | null
  totalCycleCount: number | null
  currentCycleIndex: number | null
  status: ThermocyclerStatus
}
export interface HeaterShakerData {
  labwareLatchStatus: LatchStatus
  speedStatus: SpeedStatus
  temperatureStatus: TemperatureStatus
  currentSpeed: number | null
  currentTemperature: number | null
  targetSpeed: number | null
  targetTemperature: number | null
  errorDetails: string | null
  status: HeaterShakerStatus
}

export type TemperatureStatus =
  | 'idle'
  | 'holding at target'
  | 'cooling'
  | 'heating'

export type ThermocyclerStatus =
  | 'idle'
  | 'holding at target'
  | 'cooling'
  | 'heating'
  | 'error'

export type MagneticStatus = 'engaged' | 'disengaged'

export type HeaterShakerStatus = 'idle' | 'running' | 'error'

export type SpeedStatus =
  | 'holding at target'
  | 'speeding up'
  | 'slowing down'
  | 'idle'
  | 'error'

export type LatchStatus =
  | 'opening'
  | 'idle_open'
  | 'closing'
  | 'idle_closed'
  | 'idle_unknown'
  | 'unknown'

export interface ApiTemperatureModule extends ApiBaseModule {
  moduleModel: TemperatureModuleModel
  name: typeof TEMPDECK
  data: TemperatureData
}

export interface ApiTemperatureModuleLegacy extends ApiBaseModuleLegacy {
  name: typeof TEMPDECK
  data: TemperatureData
}

export interface ApiMagneticModule extends ApiBaseModule {
  moduleModel: MagneticModuleModel
  name: typeof MAGDECK
  data: MagneticData
}

export interface ApiMagneticModuleLegacy extends ApiBaseModuleLegacy {
  name: typeof MAGDECK
  data: MagneticData
}

export interface ApiThermocyclerModule extends ApiBaseModule {
  moduleModel: ThermocyclerModuleModel
  name: typeof THERMOCYCLER
  data: ThermocyclerData
}

export interface ApiThermocyclerModuleLegacy extends ApiBaseModuleLegacy {
  name: typeof THERMOCYCLER
  data: ThermocyclerData
  status: ThermocyclerStatus
}

export interface ApiHeaterShakerModule extends ApiBaseModule {
  moduleModel: HeaterShakerModuleModel
  data: HeaterShakerData
}

export type ApiAttachedModule =
  | ApiThermocyclerModule
  | ApiMagneticModule
  | ApiTemperatureModule
  | ApiHeaterShakerModule

export type ApiAttachedModuleLegacy =
  | ApiThermocyclerModuleLegacy
  | ApiTemperatureModuleLegacy
  | ApiMagneticModuleLegacy

export type ModuleCommand =
  | 'set_temperature'
  | 'set_block_temperature'
  | 'set_lid_temperature'
  | 'deactivate'
  | 'deactivate_lid'
  | 'deactivate_block'
  | 'open'
  | 'engage'
