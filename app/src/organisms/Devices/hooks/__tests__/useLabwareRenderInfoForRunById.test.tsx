import { renderHook } from '@testing-library/react-hooks'
import { when, resetAllWhenMocks } from 'jest-when'

import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'

import { getLabwareRenderInfo } from '../../ProtocolRun/utils/getLabwareRenderInfo'
import { useLabwareRenderInfoForRunById, useProtocolDetailsForRun } from '..'

import type { ProtocolAnalysisFile } from '@opentrons/shared-data'
import type { ProtocolDetails } from '..'

jest.mock('../../ProtocolRun/utils/getLabwareRenderInfo')
jest.mock('../useProtocolDetailsForRun')

const mockGetLabwareRenderInfo = getLabwareRenderInfo as jest.MockedFunction<
  typeof getLabwareRenderInfo
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>

const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as ProtocolAnalysisFile<{}>

const PROTOCOL_DETAILS = {
  displayName: 'fake protocol',
  protocolData: simpleV6Protocol,
  protocolKey: 'fakeProtocolKey',
}

// these are just taken from the ot-2 deck def for readability
const SLOT_2_COORDS = [132.5, 0.0, 0.0]
const SLOT_4_COORDS = [0.0, 90.5, 0.0]
const SLOT_5_COORDS = [132.5, 90.5, 0.0]
const SLOT_6_COORDS = [265.0, 90.5, 0.0]
const SLOT_9_COORDS = [265.0, 181.0, 0.0]
const SLOT_10_COORDS = [0.0, 271.5, 0.0]

// labware ids come from the fixture protocol, they are just here for readability
const OPENTRONS_96_TIPRACK_1000UL_TIPRACK_ID =
  '3e047fb0-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_tiprack_1000ul/1'
const NEST_1_RESEVOIR_195ML_ID =
  '5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/1'
const CORNING_24_WELLPLATE_1_ID = '53d3b350-a9c0-11eb-bce6-9f1d5b9c1a1b'
const CORNING_24_WELLPLATE_2_ID =
  '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1'
const OPENTRONS_96_TIPRACK_20UL_TIPRACK_ID =
  'faa13a50-a9bf-11eb-bce6-9f1d5b9c1a1b:opentrons/opentrons_96_tiprack_20ul/1'
const labeledLabwareDisplayName = 'customLabwareDisplayName'

const LABWARE_RENDER_INFO = {
  // slot 1 has mag mod
  // slot 2
  [OPENTRONS_96_TIPRACK_1000UL_TIPRACK_ID]: {
    labwareDef: expect.anything(),
    displayName: null,
    x: SLOT_2_COORDS[0],
    y: SLOT_2_COORDS[1],
    z: SLOT_2_COORDS[2],
  },
  // slot 3 has temp mod
  // slot 4
  [NEST_1_RESEVOIR_195ML_ID]: {
    labwareDef: expect.anything(),
    displayName: null,
    x: SLOT_4_COORDS[0],
    y: SLOT_4_COORDS[1],
    z: SLOT_4_COORDS[2],
  },
  // slot 5
  [CORNING_24_WELLPLATE_2_ID]: {
    labwareDef: expect.anything(),
    displayName: null,
    x: SLOT_5_COORDS[0],
    y: SLOT_5_COORDS[1],
    z: SLOT_5_COORDS[2],
  },
  // slot 6
  [CORNING_24_WELLPLATE_1_ID]: {
    labwareDef: expect.anything(),
    displayName: null,
    x: SLOT_6_COORDS[0],
    y: SLOT_6_COORDS[1],
    z: SLOT_6_COORDS[2],
  },
  // slot 7 has TC
  // slot 9
  [OPENTRONS_96_TIPRACK_20UL_TIPRACK_ID]: {
    labwareDef: expect.anything(),
    displayName: null,
    x: SLOT_9_COORDS[0],
    y: SLOT_9_COORDS[1],
    z: SLOT_9_COORDS[2],
  },
  // slot 10
  abc123: {
    labwareDef: expect.anything(),
    displayName: labeledLabwareDisplayName,
    x: SLOT_10_COORDS[0],
    y: SLOT_10_COORDS[1],
    z: SLOT_10_COORDS[2],
  },
}

describe('useLabwareRenderInfoForRunById hook', () => {
  beforeEach(() => {
    when(mockUseProtocolDetailsForRun)
      .calledWith('1')
      .mockReturnValue(PROTOCOL_DETAILS)
    when(mockGetLabwareRenderInfo)
      .calledWith(simpleV6Protocol, standardDeckDef as any)
      .mockReturnValue(LABWARE_RENDER_INFO)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no labware render info when protocol details not found', () => {
    when(mockUseProtocolDetailsForRun)
      .calledWith('1')
      .mockReturnValue({} as ProtocolDetails)
    const { result } = renderHook(() => useLabwareRenderInfoForRunById('1'))
    expect(result.current).toStrictEqual({})
  })

  it('should return labware render info', () => {
    const { result } = renderHook(() => useLabwareRenderInfoForRunById('1'))
    expect(result.current).toStrictEqual(LABWARE_RENDER_INFO)
  })
})
