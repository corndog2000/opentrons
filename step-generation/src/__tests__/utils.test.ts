import {
  getLabwareDefURI,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
  THERMOCYCLER_MODULE_TYPE,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import {
  fixtureP10Single,
  fixtureP300Multi,
} from '@opentrons/shared-data/pipette/fixtures/name'
import _fixtureTrash from '@opentrons/shared-data/labware/fixtures/2/fixture_trash.json'
import _fixture96Plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import _fixtureTiprack10ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import _fixtureTiprack300ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import { FIXED_TRASH_ID, TEMPERATURE_DEACTIVATED } from '../constants'
import {
  AIR,
  DEST_WELL_BLOWOUT_DESTINATION,
  getDispenseAirGapLocation,
  getLocationTotalVolume,
  makeInitialRobotState,
  mergeLiquid,
  repeatArray,
  SOURCE_WELL_BLOWOUT_DESTINATION,
  splitLiquid,
} from '../utils/misc'
import { Diff, thermocyclerStateDiff } from '../utils/thermocyclerStateDiff'
import { DEFAULT_CONFIG } from '../fixtures'
import { orderWells, thermocyclerPipetteCollision } from '../utils'
import type { RobotState } from '../'
import {
  ThermocyclerModuleState,
  ThermocyclerStateStepArgs,
  WellOrderOption,
} from '../types'

const fixtureTrash = _fixtureTrash as LabwareDefinition2
const fixture96Plate = _fixture96Plate as LabwareDefinition2
const fixtureTiprack10ul = _fixtureTiprack10ul as LabwareDefinition2
const fixtureTiprack300ul = _fixtureTiprack300ul as LabwareDefinition2

describe('splitLiquid', () => {
  const singleIngred = {
    ingred1: { volume: 100 },
  }

  const twoIngred = {
    ingred1: { volume: 100 },
    ingred2: { volume: 300 },
  }

  it('simple split with 1 ingredient in source', () => {
    expect(splitLiquid(60, singleIngred)).toEqual({
      source: { ingred1: { volume: 40 } },
      dest: { ingred1: { volume: 60 } },
    })
  })

  it('get 0 volume in source when you split it all', () => {
    expect(splitLiquid(100, singleIngred)).toEqual({
      source: { ingred1: { volume: 0 } },
      dest: { ingred1: { volume: 100 } },
    })
  })

  it('split with 2 ingredients in source', () => {
    expect(splitLiquid(20, twoIngred)).toEqual({
      source: {
        ingred1: { volume: 95 },
        ingred2: { volume: 285 },
      },
      dest: {
        ingred1: { volume: 5 },
        ingred2: { volume: 15 },
      },
    })
  })

  it('split all with 2 ingredients', () => {
    expect(splitLiquid(400, twoIngred)).toEqual({
      source: {
        ingred1: { volume: 0 },
        ingred2: { volume: 0 },
      },
      dest: twoIngred,
    })
  })

  it('taking out 0 volume results in same source, empty dest', () => {
    expect(splitLiquid(0, twoIngred)).toEqual({
      source: twoIngred,
      dest: {
        ingred1: { volume: 0 },
        ingred2: { volume: 0 },
      },
    })
  })

  it('split with 2 ingreds, one has 0 vol', () => {
    expect(
      splitLiquid(50, {
        ingred1: { volume: 200 },
        ingred2: { volume: 0 },
      })
    ).toEqual({
      source: {
        ingred1: { volume: 150 },
        ingred2: { volume: 0 },
      },
      dest: {
        ingred1: { volume: 50 },
        ingred2: { volume: 0 },
      },
    })
  })

  it('split with 2 ingredients, floating-point volume', () => {
    expect(
      splitLiquid(
        1000 / 3, // ~333.33
        twoIngred
      )
    ).toEqual({
      source: {
        ingred1: { volume: 100 - (0.25 * 1000) / 3 },
        ingred2: { volume: 50 },
      },
      dest: {
        ingred1: { volume: (0.25 * 1000) / 3 },
        ingred2: { volume: 250 },
      },
    })
  })

  it('splitting with no ingredients in source just splits "air"', () => {
    expect(splitLiquid(100, {})).toEqual({
      source: {},
      dest: { [AIR]: { volume: 100 } },
    })
  })

  it('splitting with 0 volume in source just splits "air"', () => {
    expect(splitLiquid(100, { ingred1: { volume: 0 } })).toEqual({
      source: { ingred1: { volume: 0 } },
      dest: { [AIR]: { volume: 100 } },
    })
  })

  it('splitting with excessive volume leaves "air" in dest', () => {
    expect(
      splitLiquid(100, { ingred1: { volume: 50 }, ingred2: { volume: 20 } })
    ).toEqual({
      source: { ingred1: { volume: 0 }, ingred2: { volume: 0 } },
      dest: {
        ingred1: { volume: 50 },
        ingred2: { volume: 20 },
        [AIR]: { volume: 30 },
      },
    })
  })

  // TODO Ian 2018-03-19 figure out what to do with air warning reporting
  it.todo('splitting with air in source should do something (throw error???)')
  // expect(() =>
  // splitLiquid(50, { ingred1: { volume: 100 }, [AIR]: { volume: 20 } })
  // ).toThrow(/source cannot contain air/)
})

describe('mergeLiquid', () => {
  it('merge ingreds 1 2 with 2 3 to get 1 2 3', () => {
    expect(
      mergeLiquid(
        {
          ingred1: { volume: 30 },
          ingred2: { volume: 40 },
        },
        {
          ingred2: { volume: 15 },
          ingred3: { volume: 25 },
        }
      )
    ).toEqual({
      ingred1: { volume: 30 },
      ingred2: { volume: 55 },
      ingred3: { volume: 25 },
    })
  })

  it('merge ingreds 3 with 1 2 to get 1 2 3', () => {
    expect(
      mergeLiquid(
        {
          ingred3: { volume: 25 },
        },
        {
          ingred1: { volume: 30 },
          ingred2: { volume: 40 },
        }
      )
    ).toEqual({
      ingred1: { volume: 30 },
      ingred2: { volume: 40 },
      ingred3: { volume: 25 },
    })
  })
})

describe('repeatArray', () => {
  it('repeat array of objects', () => {
    expect(repeatArray([{ a: 1 }, { b: 2 }, { c: 3 }], 3)).toEqual([
      { a: 1 },
      { b: 2 },
      { c: 3 },
      { a: 1 },
      { b: 2 },
      { c: 3 },
      { a: 1 },
      { b: 2 },
      { c: 3 },
    ])
  })

  it('repeat array of arrays', () => {
    expect(
      repeatArray(
        [
          [1, 2],
          [3, 4],
        ],
        4
      )
    ).toEqual([
      [1, 2],
      [3, 4],
      [1, 2],
      [3, 4],
      [1, 2],
      [3, 4],
      [1, 2],
      [3, 4],
    ])
  })
})

describe('makeInitialRobotState', () => {
  expect(
    makeInitialRobotState({
      invariantContext: {
        config: DEFAULT_CONFIG,
        pipetteEntities: {
          p10SingleId: {
            id: 'p10SingleId',
            name: 'p10_single',
            spec: fixtureP10Single,
            tiprackDefURI: getLabwareDefURI(fixtureTiprack10ul),
            tiprackLabwareDef: fixtureTiprack10ul,
          },
          p300MultiId: {
            id: 'p300MultiId',
            name: 'p300_multi',
            spec: fixtureP300Multi,
            tiprackDefURI: getLabwareDefURI(fixtureTiprack300ul),
            tiprackLabwareDef: fixtureTiprack300ul,
          },
        },
        moduleEntities: {
          someTempModuleId: {
            id: 'someTempModuleId',
            model: TEMPERATURE_MODULE_V1,
            type: TEMPERATURE_MODULE_TYPE,
          },
        },
        labwareEntities: {
          somePlateId: {
            id: 'somePlateId',
            labwareDefURI: getLabwareDefURI(fixture96Plate),
            def: fixture96Plate,
          },
          tiprack10Id: {
            id: 'tiprack10Id',
            labwareDefURI: getLabwareDefURI(fixtureTiprack10ul),
            def: fixtureTiprack10ul,
          },
          tiprack300Id: {
            id: 'tiprack300Id',
            labwareDefURI: getLabwareDefURI(fixtureTiprack300ul),
            def: fixtureTiprack300ul,
          },
          fixedTrash: {
            id: FIXED_TRASH_ID,
            labwareDefURI: getLabwareDefURI(fixtureTrash),
            def: fixtureTrash,
          },
        },
      },
      labwareLocations: {
        somePlateId: { slot: '1' },
        tiprack10Id: { slot: '2' },
        tiprack300Id: { slot: '4' },
        fixedTrash: { slot: '12' },
      },
      moduleLocations: {
        someTempModuleId: {
          slot: '3',
          moduleState: {
            type: TEMPERATURE_MODULE_TYPE,
            status: TEMPERATURE_DEACTIVATED,
            targetTemperature: null,
          },
        },
      },
      pipetteLocations: {
        p10SingleId: { mount: 'left' },
        p300MultiId: { mount: 'right' },
      },
    })
  ).toMatchSnapshot()
})

describe('thermocyclerStateDiff', () => {
  const getInitialDiff = (): Diff => ({
    lidOpen: false,
    lidClosed: false,
    setBlockTemperature: false,
    deactivateBlockTemperature: false,
    setLidTemperature: false,
    deactivateLidTemperature: false,
  })
  const thermocyclerId = 'thermocyclerId'
  const testCases: Array<{
    testMsg: string
    moduleState: ThermocyclerModuleState
    args: ThermocyclerStateStepArgs
    expected: Diff
  }> = [
    {
      testMsg: 'returns lidOpen when the lid state has changed to open',
      moduleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: null,
      },
      args: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: true,
      },
      expected: {
        ...getInitialDiff(),
        lidOpen: true,
      },
    },
    {
      testMsg:
        'does NOT return lidOpen when the lid state did not change to open',
      moduleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: null,
      },
      args: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: false,
      },
      expected: {
        ...getInitialDiff(),
        lidOpen: false,
        lidClosed: true,
      },
    },
    {
      testMsg: 'returns lidClosed when the lid state has changed to closed',
      moduleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: null,
      },
      args: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: false,
      },
      expected: {
        ...getInitialDiff(),
        lidClosed: true,
      },
    },
    {
      testMsg:
        'does NOT return lidClosed when the lid state did not change to closed',
      moduleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: null,
      },
      args: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: true,
      },
      expected: {
        ...getInitialDiff(),
        lidClosed: false,
        lidOpen: true,
      },
    },
    {
      testMsg:
        'returns setLidTemperature when the lid temperature state changes from null to non null value',
      moduleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: false,
      },
      args: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: 20,
        lidOpen: false,
      },
      expected: {
        ...getInitialDiff(),
        setLidTemperature: true,
      },
    },
    {
      testMsg:
        'returns setLidTemperature when the lid temperature state changes from a non null value to a different non null value',
      moduleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: 20,
        lidOpen: false,
      },
      args: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: 30,
        lidOpen: false,
      },
      expected: {
        ...getInitialDiff(),
        setLidTemperature: true,
      },
    },
    {
      testMsg:
        'does NOT return setLidTemperature when the lid temperature state stays the same ',
      moduleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: 20,
        lidOpen: false,
      },
      args: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: 20,
        lidOpen: false,
      },
      expected: {
        ...getInitialDiff(),
        setLidTemperature: false,
      },
    },
    {
      testMsg:
        'returns deactivateLidTemperature when the lid temperature state changes from a non null value to null',
      moduleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: 20,
        lidOpen: false,
      },
      args: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: false,
      },
      expected: {
        ...getInitialDiff(),
        deactivateLidTemperature: true,
      },
    },
    {
      testMsg:
        'returns setBlockTemperature when the block temperature state has changed to non null value',
      moduleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: false,
      },
      args: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: 20,
        lidTargetTemp: null,
        lidOpen: false,
      },
      expected: {
        ...getInitialDiff(),
        setBlockTemperature: true,
      },
    },
    {
      testMsg:
        'returns no diff when the block temperature state is the same number as previous',
      moduleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: 20,
        lidTargetTemp: null,
        lidOpen: false,
      },
      args: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: 20,
        lidTargetTemp: null,
        lidOpen: false,
      },
      expected: {
        ...getInitialDiff(),
      },
    },
    {
      testMsg:
        'returns activate block when temp goes from number to a different number',
      moduleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: 20,
        lidTargetTemp: null,
        lidOpen: false,
      },
      args: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: 40,
        lidTargetTemp: null,
        lidOpen: false,
      },
      expected: {
        ...getInitialDiff(),
        setBlockTemperature: true,
      },
    },
    {
      testMsg: 'returns deactivate block when temp goes from number to null',
      moduleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: 20,
        lidTargetTemp: null,
        lidOpen: false,
      },
      args: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: false,
      },
      expected: {
        ...getInitialDiff(),
        deactivateBlockTemperature: true,
      },
    },
  ]
  testCases.forEach(({ testMsg, moduleState, args, expected }) => {
    it(testMsg, () => {
      expect(thermocyclerStateDiff(moduleState, args)).toEqual(expected)
    })
  })
})

describe('thermocyclerPipetteColision', () => {
  const thermocyclerId = 'thermocyclerId'
  const labwareOnTCId = 'labwareOnTCId'

  const testCases: Array<{
    testMsg: string
    modules: RobotState['modules']
    labware: RobotState['labware']
    labwareId: string
    expected: boolean
  }> = [
    {
      testMsg:
        'returns true when aspirating from labware on TC with lidOpen set to null',
      modules: {
        [thermocyclerId]: {
          slot: '7',
          moduleState: {
            type: THERMOCYCLER_MODULE_TYPE,
            blockTargetTemp: null,
            lidTargetTemp: null,
            lidOpen: null,
          },
        },
      },
      labware: {
        [labwareOnTCId]: { slot: thermocyclerId }, // when labware is on a module, the slot is the module's id
      },
      labwareId: labwareOnTCId,
      expected: true,
    },
    {
      testMsg:
        'returns true when aspirating from labware on TC with lidOpen set to false',
      modules: {
        [thermocyclerId]: {
          slot: '7',
          moduleState: {
            type: THERMOCYCLER_MODULE_TYPE,
            blockTargetTemp: null,
            lidTargetTemp: null,
            lidOpen: false,
          },
        },
      },
      labware: {
        [labwareOnTCId]: { slot: thermocyclerId }, // when labware is on a module, the slot is the module's id
      },
      labwareId: labwareOnTCId,
      expected: true,
    },
    {
      testMsg:
        'returns false when aspirating from labware on TC with lidOpen set to true',
      modules: {
        [thermocyclerId]: {
          slot: '7',
          moduleState: {
            type: THERMOCYCLER_MODULE_TYPE,
            blockTargetTemp: null,
            lidTargetTemp: null,
            lidOpen: true,
          },
        },
      },
      labware: {
        [labwareOnTCId]: { slot: thermocyclerId }, // when labware is on a module, the slot is the module's id
      },
      labwareId: labwareOnTCId,
      expected: false,
    },
    {
      testMsg:
        'returns false when labware is not on TC, even when TC lid is closed',
      modules: {
        [thermocyclerId]: {
          slot: '7',
          moduleState: {
            type: THERMOCYCLER_MODULE_TYPE,
            blockTargetTemp: null,
            lidTargetTemp: null,
            lidOpen: false,
          },
        },
      },
      labware: {
        [labwareOnTCId]: { slot: thermocyclerId },
      },
      labwareId: 'someOtherLabwareNotOnTC',
      expected: false,
    },
  ]

  testCases.forEach(({ testMsg, modules, labware, labwareId, expected }) => {
    it(testMsg, () => {
      expect(thermocyclerPipetteCollision(modules, labware, labwareId)).toBe(
        expected
      )
    })
  })
})

describe('getDispenseAirGapLocation', () => {
  let sourceLabware: string
  let destLabware: string
  let sourceWell: string
  let destWell: string
  beforeEach(() => {
    sourceLabware = 'sourceLabware'
    destLabware = 'destLabware'
    sourceWell = 'sourceWell'
    destWell = 'destWell'
  })
  it('should return destination when blowout location is NOT source', () => {
    const locations = [
      DEST_WELL_BLOWOUT_DESTINATION,
      FIXED_TRASH_ID,
      'some_rando_location',
    ]
    expect.assertions(locations.length)
    locations.forEach(blowoutLocation => {
      expect(
        getDispenseAirGapLocation({
          blowoutLocation,
          sourceLabware,
          destLabware,
          sourceWell,
          destWell,
        })
      ).toEqual({
        dispenseAirGapLabware: destLabware,
        dispenseAirGapWell: destWell,
      })
    })
  })
  it('should return source when blowout location is source', () => {
    expect(
      getDispenseAirGapLocation({
        blowoutLocation: SOURCE_WELL_BLOWOUT_DESTINATION,
        sourceLabware,
        destLabware,
        sourceWell,
        destWell,
      })
    ).toEqual({
      dispenseAirGapLabware: sourceLabware,
      dispenseAirGapWell: sourceWell,
    })
  })
})

describe('getLocationTotalVolume', () => {
  it('should return the sum of all non-AIR volumes', () => {
    const result = getLocationTotalVolume({
      a: { volume: 2 },
      b: { volume: 4 },
      [AIR]: { volume: 100 },
    })
    expect(result).toEqual(2 + 4)
  })

  it('should return 0 for empty location', () => {
    const result = getLocationTotalVolume({})
    expect(result).toEqual(0)
  })

  it('should return 0 location with only AIR', () => {
    const result = getLocationTotalVolume({ [AIR]: { volume: 123 } })
    expect(result).toEqual(0)
  })
})

describe('orderWells', () => {
  const orderTuples: Array<[WellOrderOption, WellOrderOption]> = [
    ['t2b', 'l2r'],
    ['t2b', 'r2l'],
    ['b2t', 'l2r'],
    ['b2t', 'r2l'],
    ['l2r', 't2b'],
    ['l2r', 'b2t'],
    ['r2l', 't2b'],
    ['r2l', 'b2t'],
  ]

  describe('regular labware', () => {
    const regularOrdering = [
      ['A1', 'B1'],
      ['A2', 'B2'],
    ]
    const regularAnswerMap: Record<
      WellOrderOption,
      Partial<Record<WellOrderOption, string[]>>
    > = {
      t2b: {
        l2r: ['A1', 'B1', 'A2', 'B2'],
        r2l: ['A2', 'B2', 'A1', 'B1'],
      },
      b2t: {
        l2r: ['B1', 'A1', 'B2', 'A2'],
        r2l: ['B2', 'A2', 'B1', 'A1'],
      },
      l2r: {
        t2b: ['A1', 'A2', 'B1', 'B2'],
        b2t: ['B1', 'B2', 'A1', 'A2'],
      },
      r2l: {
        t2b: ['A2', 'A1', 'B2', 'B1'],
        b2t: ['B2', 'B1', 'A2', 'A1'],
      },
    }
    orderTuples.forEach(tuple => {
      it(`first ${tuple[0]} then ${tuple[1]}`, () => {
        expect(orderWells(regularOrdering, ...tuple)).toEqual(
          regularAnswerMap[tuple[0]][tuple[1]]
        )
      })
    })
  })

  describe('irregular labware', () => {
    const irregularOrdering = [
      ['A1', 'B1'],
      ['A2', 'B2', 'C2'],
      ['A3'],
      ['A4', 'B4', 'C4', 'D4'],
    ]
    const irregularAnswerMap: Record<
      WellOrderOption,
      Partial<Record<WellOrderOption, string[]>>
    > = {
      t2b: {
        l2r: ['A1', 'B1', 'A2', 'B2', 'C2', 'A3', 'A4', 'B4', 'C4', 'D4'],
        r2l: ['A4', 'B4', 'C4', 'D4', 'A3', 'A2', 'B2', 'C2', 'A1', 'B1'],
      },
      b2t: {
        l2r: ['B1', 'A1', 'C2', 'B2', 'A2', 'A3', 'D4', 'C4', 'B4', 'A4'],
        r2l: ['D4', 'C4', 'B4', 'A4', 'A3', 'C2', 'B2', 'A2', 'B1', 'A1'],
      },
      l2r: {
        t2b: ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B4', 'C2', 'C4', 'D4'],
        b2t: ['D4', 'C2', 'C4', 'B1', 'B2', 'B4', 'A1', 'A2', 'A3', 'A4'],
      },
      r2l: {
        t2b: ['A4', 'A3', 'A2', 'A1', 'B4', 'B2', 'B1', 'C4', 'C2', 'D4'],
        b2t: ['D4', 'C4', 'C2', 'B4', 'B2', 'B1', 'A4', 'A3', 'A2', 'A1'],
      },
    }

    orderTuples.forEach(tuple => {
      it(`first ${tuple[0]} then ${tuple[1]}`, () => {
        expect(orderWells(irregularOrdering, ...tuple)).toEqual(
          irregularAnswerMap[tuple[0]][tuple[1]]
        )
      })
    })
  })
})
