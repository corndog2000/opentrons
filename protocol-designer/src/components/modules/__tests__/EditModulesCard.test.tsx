import React from 'react'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
} from '@opentrons/shared-data'
import { TEMPERATURE_DEACTIVATED } from '@opentrons/step-generation'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import {
  ModuleOnDeck,
  selectors as stepFormSelectors,
} from '../../../step-forms'
import { FormPipette } from '../../../step-forms/types'
import { SUPPORTED_MODULE_TYPES } from '../../../modules'
import { EditModulesCard } from '../EditModulesCard'
import { CrashInfoBox } from '../CrashInfoBox'
import { ModuleRow } from '../ModuleRow'

jest.mock('../../../feature-flags')
jest.mock('../../../step-forms/selectors')

const getDisableModuleRestrictionsMock = featureFlagSelectors.getDisableModuleRestrictions as jest.MockedFunction<
  typeof featureFlagSelectors.getDisableModuleRestrictions
>
const getPipettesForEditPipetteFormMock = stepFormSelectors.getPipettesForEditPipetteForm as jest.MockedFunction<
  typeof stepFormSelectors.getPipettesForEditPipetteForm
>
const getEnabledHeaterShakerMock = featureFlagSelectors.getEnabledHeaterShaker as jest.MockedFunction<
  typeof featureFlagSelectors.getEnabledHeaterShaker
>

describe('EditModulesCard', () => {
  let store: any
  let crashableMagneticModule: ModuleOnDeck | undefined
  let nonCrashableMagneticModule: ModuleOnDeck | undefined
  let crashablePipette: FormPipette
  let noncrashablePipette: FormPipette
  let props: React.ComponentProps<typeof EditModulesCard>
  beforeEach(() => {
    crashableMagneticModule = {
      id: 'magnet123',
      type: MAGNETIC_MODULE_TYPE,
      model: MAGNETIC_MODULE_V1,
      moduleState: {
        type: MAGNETIC_MODULE_TYPE,
        engaged: false,
      },
      slot: '1',
    }
    nonCrashableMagneticModule = {
      ...crashableMagneticModule,
      model: MAGNETIC_MODULE_V2,
    }

    store = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }

    crashablePipette = {
      pipetteName: 'p300_multi',
      tiprackDefURI: 'tiprack300',
    }
    noncrashablePipette = {
      pipetteName: 'p300_multi_test',
      tiprackDefURI: 'tiprack300',
    }

    getDisableModuleRestrictionsMock.mockReturnValue(false)
    getPipettesForEditPipetteFormMock.mockReturnValue({
      left: crashablePipette,
      right: {
        pipetteName: null,
        tiprackDefURI: null,
      },
    })
    getEnabledHeaterShakerMock.mockReturnValue(true)

    props = {
      modules: {},
      openEditModuleModal: jest.fn(),
    }
  })

  function render(renderProps: React.ComponentProps<typeof EditModulesCard>) {
    return mount(
      <Provider store={store}>
        <EditModulesCard {...renderProps} />
      </Provider>
    )
  }

  it('does not show crash info box when crashable pipette is used and no module with collision issues and restrictions are not disabled', () => {
    props.modules = {
      [MAGNETIC_MODULE_TYPE]: nonCrashableMagneticModule,
    }

    const wrapper = render(props)

    expect(wrapper.find(CrashInfoBox)).toHaveLength(0)
  })

  it('displays crash warning info box when crashable pipette is used with module with collision issue and restrictions are not disabled', () => {
    props.modules = {
      [MAGNETIC_MODULE_TYPE]: crashableMagneticModule,
    }

    const wrapper = render(props)

    expect(wrapper.find(CrashInfoBox)).toHaveLength(1)
  })

  it('does not display crash warning when non crashable pipette is used with module with collision issues', () => {
    props.modules = {
      [MAGNETIC_MODULE_TYPE]: crashableMagneticModule,
    }
    getPipettesForEditPipetteFormMock.mockReturnValue({
      left: noncrashablePipette,
      right: {
        pipetteName: null,
        tiprackDefURI: null,
      },
    })

    const wrapper = render(props)

    expect(wrapper.find(CrashInfoBox)).toHaveLength(0)
  })

  it('displays crash info text only for the module with issue', () => {
    const crashableTemperatureModule = {
      id: 'temp098',
      type: TEMPERATURE_MODULE_TYPE,
      model: TEMPERATURE_MODULE_V1,
      slot: '3',
      moduleState: {
        type: TEMPERATURE_MODULE_TYPE,
        status: TEMPERATURE_DEACTIVATED,
        targetTemperature: null,
      },
    }
    props.modules = {
      [MAGNETIC_MODULE_TYPE]: nonCrashableMagneticModule,
      [TEMPERATURE_MODULE_TYPE]: crashableTemperatureModule,
    }

    const wrapper = render(props)

    expect(wrapper.find(CrashInfoBox).props()).toEqual({
      magnetOnDeck: false,
      temperatureOnDeck: true,
    })
  })

  it('does not display crash warnings when restrictions are disabled', () => {
    props.modules = {
      [MAGNETIC_MODULE_TYPE]: crashableMagneticModule,
    }
    getDisableModuleRestrictionsMock.mockReturnValue(true)

    const wrapper = render(props)

    expect(wrapper.find(CrashInfoBox)).toHaveLength(0)
  })

  it('displays module row with added module', () => {
    props.modules = {
      [MAGNETIC_MODULE_TYPE]: crashableMagneticModule,
    }

    const wrapper = render(props)

    expect(
      wrapper.find(ModuleRow).filter({ type: MAGNETIC_MODULE_TYPE }).props()
    ).toEqual({
      type: MAGNETIC_MODULE_TYPE,
      moduleOnDeck: crashableMagneticModule,
      showCollisionWarnings: true,
      openEditModuleModal: props.openEditModuleModal,
    })
  })

  it('displays module row with module to add when no moduleData', () => {
    const wrapper = render(props)

    expect(wrapper.find(ModuleRow)).toHaveLength(4)
    SUPPORTED_MODULE_TYPES.forEach(moduleType => {
      expect(
        wrapper.find(ModuleRow).filter({ type: moduleType }).props()
      ).toEqual({
        type: moduleType,
        openEditModuleModal: props.openEditModuleModal,
      })
    })
  })
})
