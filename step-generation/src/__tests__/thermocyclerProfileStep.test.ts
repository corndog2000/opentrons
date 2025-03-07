// @ts-nocheck TODO: remove this after https://github.com/Opentrons/opentrons/pull/10178 merges
import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import { thermocyclerProfileStep } from '../commandCreators/compound/thermocyclerProfileStep'
import {
  getErrorResult,
  getStateAndContextTempTCModules,
  getSuccessResult,
} from '../fixtures'
import type { CreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6'
import type {
  ThermocyclerModuleState,
  ThermocyclerProfileStepArgs,
} from '../types'

const temperatureModuleId = 'temperatureModuleId'
const thermocyclerId = 'thermocyclerId'

describe('thermocyclerProfileStep', () => {
  const testCases: Array<{
    testName: string
    initialThermocyclerModuleState?: ThermocyclerModuleState
    args: ThermocyclerProfileStepArgs
    expected: CreateCommand[]
  }> = [
    {
      testName: 'should generate expected commands',
      args: {
        commandCreatorFnName: 'thermocyclerProfile',
        blockTargetTempHold: 4,
        lidTargetTempHold: null,
        lidOpenHold: true,
        module: thermocyclerId,
        profileSteps: [],
        profileTargetLidTemp: 55,
        profileVolume: 42,
      },
      expected: [
        {
          commandType: 'thermocycler/closeLid',
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/setTargetLidTemperature',
          params: {
            moduleId: 'thermocyclerId',
            celsius: 55,
          },
        },
        {
          commandType: 'thermocycler/waitForLidTemperature',
          params: {
            moduleId: 'thermocyclerId',
            celsius: 55,
          },
        },
        {
          commandType: 'thermocycler/runProfile',
          params: {
            moduleId: 'thermocyclerId',
            profile: [],
            volume: 42,
          },
        },
        {
          commandType: 'thermocycler/awaitProfileComplete',
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/openLid',
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/setAndWaitForBlockTemperature',
          params: {
            moduleId: 'thermocyclerId',
            celsius: 4,
          },
        },
        {
          commandType: 'thermocycler/waitForBlockTemperature',
          params: {
            moduleId: 'thermocyclerId',
            celsius: 4,
          },
        },
        {
          commandType: 'thermocycler/deactivateLid',
          params: {
            moduleId: 'thermocyclerId',
          },
        },
      ],
    },
    {
      testName:
        'should omit the setTargetLidTemperature when lid temp is already at desired temp',
      initialThermocyclerModuleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: 55,
        lidOpen: false,
      },
      args: {
        commandCreatorFnName: 'thermocyclerProfile',
        blockTargetTempHold: 4,
        lidTargetTempHold: null,
        lidOpenHold: true,
        module: thermocyclerId,
        profileSteps: [{ temperature: 61, holdTime: 99 }],
        profileTargetLidTemp: 55,
        profileVolume: 42,
      },
      expected: [
        {
          commandType: 'thermocycler/runProfile',
          params: {
            moduleId: 'thermocyclerId',
            profile: [{ temperature: 61, holdTime: 99 }],
            volume: 42,
          },
        },
        {
          commandType: 'thermocycler/awaitProfileComplete',
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/openLid',
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/setAndWaitForBlockTemperature',
          params: {
            moduleId: 'thermocyclerId',
            celsius: 4,
          },
        },
        {
          commandType: 'thermocycler/waitForBlockTemperature',
          params: {
            moduleId: 'thermocyclerId',
            celsius: 4,
          },
        },
        {
          commandType: 'thermocycler/deactivateLid',
          params: {
            moduleId: 'thermocyclerId',
          },
        },
      ],
    },
    {
      testName:
        'should close the lid before running the profile if the lid open state is null',
      initialThermocyclerModuleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: 55,
        lidOpen: null,
      },
      args: {
        commandCreatorFnName: 'thermocyclerProfile',
        blockTargetTempHold: 4,
        lidTargetTempHold: null,
        lidOpenHold: true,
        module: thermocyclerId,
        profileSteps: [{ temperature: 61, holdTime: 99 }],
        profileTargetLidTemp: 55,
        profileVolume: 42,
      },
      expected: [
        {
          commandType: 'thermocycler/closeLid',
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/runProfile',
          params: {
            moduleId: 'thermocyclerId',
            profile: [{ temperature: 61, holdTime: 99 }],
            volume: 42,
          },
        },
        {
          commandType: 'thermocycler/awaitProfileComplete',
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/openLid',
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/setAndWaitForBlockTemperature',
          params: {
            moduleId: 'thermocyclerId',
            celsius: 4,
          },
        },
        {
          commandType: 'thermocycler/waitForBlockTemperature',
          params: {
            moduleId: 'thermocyclerId',
            celsius: 4,
          },
        },
        {
          commandType: 'thermocycler/deactivateLid',
          params: {
            moduleId: 'thermocyclerId',
          },
        },
      ],
    },
    {
      testName:
        'should omit the closeLid when the lid open state is false before running a profile',
      initialThermocyclerModuleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: 55,
        lidOpen: false,
      },
      args: {
        commandCreatorFnName: 'thermocyclerProfile',
        blockTargetTempHold: 4,
        lidTargetTempHold: null,
        lidOpenHold: true,
        module: thermocyclerId,
        profileSteps: [{ temperature: 61, holdTime: 99 }],
        profileTargetLidTemp: 55,
        profileVolume: 42,
      },
      expected: [
        {
          commandType: 'thermocycler/runProfile',
          params: {
            moduleId: 'thermocyclerId',
            profile: [{ temperature: 61, holdTime: 99 }],
            volume: 42,
          },
        },
        {
          commandType: 'thermocycler/awaitProfileComplete',
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/openLid',
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/setAndWaitForBlockTemperature',
          params: {
            moduleId: 'thermocyclerId',
            celsius: 4,
          },
        },
        {
          commandType: 'thermocycler/waitForBlockTemperature',
          params: {
            moduleId: 'thermocyclerId',
            celsius: 4,
          },
        },
        {
          commandType: 'thermocycler/deactivateLid',
          params: {
            moduleId: 'thermocyclerId',
          },
        },
      ],
    },
  ]

  testCases.forEach(
    ({ testName, args, expected, initialThermocyclerModuleState }) => {
      it(testName, () => {
        const {
          robotState,
          invariantContext,
        } = getStateAndContextTempTCModules({
          temperatureModuleId,
          thermocyclerId,
        })

        if (initialThermocyclerModuleState) {
          robotState.modules[
            thermocyclerId
          ].moduleState = initialThermocyclerModuleState
        }

        const result = thermocyclerProfileStep(
          args,
          invariantContext,
          robotState
        )
        const { commands } = getSuccessResult(result)
        expect(commands).toEqual(expected)
      })
    }
  )

  it('should return timeline error with bad moduleId', () => {
    const { robotState, invariantContext } = getStateAndContextTempTCModules({
      temperatureModuleId,
      thermocyclerId,
    })

    const args: ThermocyclerProfileStepArgs = {
      commandCreatorFnName: 'thermocyclerProfile',
      blockTargetTempHold: 4,
      lidTargetTempHold: null,
      lidOpenHold: true,
      module: 'badModuleId',
      profileSteps: [],
      profileTargetLidTemp: 55,
      profileVolume: 42,
    }

    const result = thermocyclerProfileStep(args, invariantContext, robotState)

    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'MISSING_MODULE',
    })
  })
})
