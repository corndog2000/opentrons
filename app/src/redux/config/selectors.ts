import { createSelector } from 'reselect'
import type { DropdownOption } from '@opentrons/components'
import type { State } from '../types'
import type { Config, FeatureFlags, UpdateChannel } from './types'

export const getConfig = (state: State): Config | null => state.config

export const getDevtoolsEnabled = (state: State): boolean => {
  return state.config?.devtools ?? false
}

export const getFeatureFlags = (state: State): FeatureFlags => {
  return state.config?.devInternal ?? {}
}

export const getUpdateChannel = (state: State): UpdateChannel => {
  return state.config?.update.channel ?? 'latest'
}

export const getUseTrashSurfaceForTipCal = (state: State): boolean | null => {
  return state.config?.calibration.useTrashSurfaceForTipCal ?? null
}

export const getHasCalibrationBlock = (state: State): boolean | null => {
  const useTrashSurface = getUseTrashSurfaceForTipCal(state)
  return useTrashSurface === null ? null : !useTrashSurface
}

export const getIsHeaterShakerAttached = (state: State): boolean => {
  return state.config?.modules.heaterShaker.isAttached ?? false
}

export const getIsLabwareOffsetCodeSnippetsOn = (state: State): boolean => {
  return state.config?.labware.showLabwareOffsetCodeSnippets ?? false
}

export const getPathToPythonOverride: (
  state: State
) => string | null = createSelector(
  getConfig,
  config => config?.python.pathToPythonOverride ?? null
)

const UPDATE_CHANNEL_OPTS = [
  { name: 'Stable', value: 'latest' as UpdateChannel },
  { name: 'Beta', value: 'beta' as UpdateChannel },
]

const UPDATE_CHANNEL_OPTS_WITH_ALPHA = [
  ...UPDATE_CHANNEL_OPTS,
  { name: 'Alpha', value: 'alpha' as UpdateChannel },
]

export const getUpdateChannelOptions = (state: State): DropdownOption[] => {
  return state.config?.devtools || state.config?.update.channel === 'alpha'
    ? UPDATE_CHANNEL_OPTS_WITH_ALPHA
    : UPDATE_CHANNEL_OPTS
}
