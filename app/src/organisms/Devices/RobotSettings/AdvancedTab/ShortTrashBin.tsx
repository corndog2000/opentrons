import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../../../atoms/text'
import { ToggleButton } from '../../../../atoms/buttons'
import { updateSetting } from '../../../../redux/robot-settings'

import type { Dispatch } from '../../../../redux/types'
import type { RobotSettingsField } from '../../../../redux/robot-settings/types'

interface ShortTrashBinProps {
  settings: RobotSettingsField | undefined
  robotName: string
}

export function ShortTrashBin({
  settings,
  robotName,
}: ShortTrashBinProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const value = settings?.value ? settings.value : false
  const id = settings?.id ? settings.id : 'shortTrashBin'

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          as="h2"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          paddingBottom={SPACING.spacing4}
          id="AdvancedSettings_devTools"
        >
          {t('short_trash_bin')}
        </StyledText>
        <StyledText css={TYPOGRAPHY.pRegular}>
          {t('short_trash_bin_description')}
        </StyledText>
      </Box>
      <ToggleButton
        label="short_trash_bin"
        toggledOn={settings?.value === true}
        onClick={() => dispatch(updateSetting(robotName, id, !value))}
        id="AdvancedSettings_shortTrashBin"
      />
    </Flex>
  )
}
