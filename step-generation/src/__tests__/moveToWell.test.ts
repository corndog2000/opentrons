import { expectTimelineError } from '../__utils__/testMatchers'
import { moveToWell } from '../commandCreators/atomic/moveToWell'
import {
  thermocyclerPipetteCollision,
  pipetteIntoHeaterShakerLatchOpen,
  pipetteIntoHeaterShakerWhileShaking,
} from '../utils'
import {
  getRobotStateWithTipStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from '../fixtures'
import type { InvariantContext, RobotState } from '../types'

jest.mock('../utils/thermocyclerPipetteCollision')
jest.mock('../utils/pipetteIntoHeaterShakerLatchOpen')
jest.mock('../utils/pipetteIntoHeaterShakerWhileShaking')
const mockThermocyclerPipetteCollision = thermocyclerPipetteCollision as jest.MockedFunction<
  typeof thermocyclerPipetteCollision
>
const mockPipetteIntoHeaterShakerLatchOpen = pipetteIntoHeaterShakerLatchOpen as jest.MockedFunction<
  typeof pipetteIntoHeaterShakerLatchOpen
>
const mockPipetteIntoHeaterShakerWhileShaking = pipetteIntoHeaterShakerWhileShaking as jest.MockedFunction<
  typeof pipetteIntoHeaterShakerWhileShaking
>
describe('moveToWell', () => {
  let robotStateWithTip: RobotState
  let invariantContext: InvariantContext
  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should return a moveToWell command given only the required params', () => {
    const params = {
      pipette: DEFAULT_PIPETTE,
      labware: SOURCE_LABWARE,
      well: 'A1',
    }
    const result = moveToWell(params, invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'moveToWell',
        params: {
          pipetteId: DEFAULT_PIPETTE,
          labwareId: SOURCE_LABWARE,
          wellName: 'A1',
        },
      },
    ])
  })
  it('should apply the optional params to the command', () => {
    const params = {
      pipette: DEFAULT_PIPETTE,
      labware: SOURCE_LABWARE,
      well: 'A1',
      offset: {
        x: 1,
        y: 2,
        z: 3,
      },
      minimumZHeight: 5,
      forceDirect: true,
    }
    const result = moveToWell(params, invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'moveToWell',
        params: {
          pipetteId: DEFAULT_PIPETTE,
          labwareId: SOURCE_LABWARE,
          wellName: 'A1',
          wellLocation: {
            origin: 'bottom',
            offset: {
              x: 1,
              y: 2,
              z: 3,
            },
          },
          minimumZHeight: 5,
          forceDirect: true,
        },
      },
    ])
  })
  it('should return an error if pipette does not exist', () => {
    const result = moveToWell(
      {
        pipette: 'badPipette',
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expectTimelineError(getErrorResult(result).errors, 'PIPETTE_DOES_NOT_EXIST')
  })
  it('should return error if labware does not exist', () => {
    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: 'problematicLabwareId',
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })
  it('should return an error when moving to well in a thermocycler with pipette collision', () => {
    mockThermocyclerPipetteCollision.mockImplementationOnce(
      (
        modules: RobotState['modules'],
        labware: RobotState['labware'],
        labwareId: string
      ) => {
        expect(modules).toBe(robotStateWithTip.modules)
        expect(labware).toBe(robotStateWithTip.labware)
        expect(labwareId).toBe(SOURCE_LABWARE)
        return true
      }
    )
    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'THERMOCYCLER_LID_CLOSED',
    })
  })

  it('should return an error when moving to well in a heater-shaker with latch opened', () => {
    mockPipetteIntoHeaterShakerLatchOpen.mockImplementationOnce(
      (
        modules: RobotState['modules'],
        labware: RobotState['labware'],
        labwareId: string
      ) => {
        expect(modules).toBe(robotStateWithTip.modules)
        expect(labware).toBe(robotStateWithTip.labware)
        expect(labwareId).toBe(SOURCE_LABWARE)
        return true
      }
    )
    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_LATCH_OPEN',
    })
  })

  it('should return an error when moving to well in a heater-shaker latch is opened but is not shaking', () => {
    mockPipetteIntoHeaterShakerLatchOpen.mockImplementationOnce(
      (
        modules: RobotState['modules'],
        labware: RobotState['labware'],
        labwareId: string
      ) => {
        expect(modules).toBe(robotStateWithTip.modules)
        expect(labware).toBe(robotStateWithTip.labware)
        expect(labwareId).toBe(SOURCE_LABWARE)
        return true
      }
    )
    mockPipetteIntoHeaterShakerWhileShaking.mockImplementationOnce(
      (
        modules: RobotState['modules'],
        labware: RobotState['labware'],
        labwareId: string
      ) => {
        expect(modules).toBe(robotStateWithTip.modules)
        expect(labware).toBe(robotStateWithTip.labware)
        expect(labwareId).toBe(SOURCE_LABWARE)
        return false
      }
    )

    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_LATCH_OPEN',
    })
  })

  it('should return an error when moving to well in a heater-shaker is shaking but latch is closed', () => {
    mockPipetteIntoHeaterShakerLatchOpen.mockImplementationOnce(
      (
        modules: RobotState['modules'],
        labware: RobotState['labware'],
        labwareId: string
      ) => {
        expect(modules).toBe(robotStateWithTip.modules)
        expect(labware).toBe(robotStateWithTip.labware)
        expect(labwareId).toBe(SOURCE_LABWARE)
        return false
      }
    )
    mockPipetteIntoHeaterShakerWhileShaking.mockImplementationOnce(
      (
        modules: RobotState['modules'],
        labware: RobotState['labware'],
        labwareId: string
      ) => {
        expect(modules).toBe(robotStateWithTip.modules)
        expect(labware).toBe(robotStateWithTip.labware)
        expect(labwareId).toBe(SOURCE_LABWARE)
        return true
      }
    )

    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_IS_SHAKING',
    })
  })

  //  we should never run into this because you should not be allowed to shake when the latch is opened
  it('should return 2 errors when moving to well in a heater-shaker that is shaking and latch open', () => {
    mockPipetteIntoHeaterShakerLatchOpen.mockImplementationOnce(
      (
        modules: RobotState['modules'],
        labware: RobotState['labware'],
        labwareId: string
      ) => {
        expect(modules).toBe(robotStateWithTip.modules)
        expect(labware).toBe(robotStateWithTip.labware)
        expect(labwareId).toBe(SOURCE_LABWARE)
        return true
      }
    )
    mockPipetteIntoHeaterShakerWhileShaking.mockImplementationOnce(
      (
        modules: RobotState['modules'],
        labware: RobotState['labware'],
        labwareId: string
      ) => {
        expect(modules).toBe(robotStateWithTip.modules)
        expect(labware).toBe(robotStateWithTip.labware)
        expect(labwareId).toBe(SOURCE_LABWARE)
        return true
      }
    )

    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(2)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_LATCH_OPEN',
    })
    expect(getErrorResult(result).errors[1]).toMatchObject({
      type: 'HEATER_SHAKER_IS_SHAKING',
    })
  })
})
