import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { ChooseProtocolSlideout } from '../../ChooseProtocolSlideout'
import { ConnectionTroubleshootingModal } from '../ConnectionTroubleshootingModal'
import { RobotOverflowMenu } from '../RobotOverflowMenu'

import {
  mockUnreachableRobot,
  mockConnectedRobot,
} from '../../../redux/discovery/__fixtures__'

jest.mock('../../ProtocolUpload/hooks')
jest.mock('../../ChooseProtocolSlideout')
jest.mock('../ConnectionTroubleshootingModal')

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockChooseProtocolSlideout = ChooseProtocolSlideout as jest.MockedFunction<
  typeof ChooseProtocolSlideout
>
const mockConnectionTroubleshootingModal = ConnectionTroubleshootingModal as jest.MockedFunction<
  typeof ConnectionTroubleshootingModal
>

const render = (props: React.ComponentProps<typeof RobotOverflowMenu>) => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotOverflowMenu {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('RobotOverflowMenu', () => {
  let props: React.ComponentProps<typeof RobotOverflowMenu>

  beforeEach(() => {
    props = {
      robot: mockConnectedRobot,
    }
    mockUseCurrentRunId.mockReturnValue('RUNID')
    mockChooseProtocolSlideout.mockReturnValue(
      <div>choose protocol slideout</div>
    )
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders overflow menu items when the robot is reachable and a run id is not present', () => {
    mockUseCurrentRunId.mockReturnValue(null)
    const { getByText, getByLabelText } = render(props)
    const btn = getByLabelText('RobotOverflowMenu_button')
    fireEvent.click(btn)
    getByText('robot settings')
    const run = getByText('Run protocol')
    fireEvent.click(run)
    getByText('choose protocol slideout')
  })

  it('renders overflow menu items when the robot is reachable and a run id is present', () => {
    const { getByLabelText, getByRole } = render(props)
    const btn = getByLabelText('RobotOverflowMenu_button')
    fireEvent.click(btn)
    getByRole('link', { name: 'robot settings' })
  })

  it('renders overflow menu items when the robot is not reachable', () => {
    mockConnectionTroubleshootingModal.mockReturnValue(
      <div>mock troubleshooting modal</div>
    )
    props = {
      robot: mockUnreachableRobot,
    }
    mockUseCurrentRunId.mockReturnValue(null)
    const { getByText, getByLabelText } = render(props)
    const btn = getByLabelText('RobotOverflowMenu_button')
    fireEvent.click(btn)
    const why = getByText('Why is this robot unavailable?')
    getByText('Forget unavailable robot')
    fireEvent.click(why)
    getByText('mock troubleshooting modal')
  })
})
