import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import {
  Flex,
  Box,
  Text,
  SIZE_2,
  TYPOGRAPHY,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'
import type { Dispatch, State } from '../../redux/types'
import {
  toggleAnalyticsOptedIn,
  getAnalyticsOptedIn,
} from '../../redux/analytics'

import { ToggleButton } from '../../atoms/buttons'

export function PrivacySettings(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()
  const analyticsOptedIn = useSelector((s: State) => getAnalyticsOptedIn(s))

  return (
    <Flex
      height="calc(100vh - 8.5rem)"
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      paddingX={SPACING.spacing4}
      paddingY={SPACING.spacing5}
      gridGap={SPACING.spacing4}
    >
      <Box width="70%">
        <Text css={TYPOGRAPHY.h3SemiBold} paddingBottom={SPACING.spacing3}>
          {t('share_analytics')}
        </Text>
        <Text css={TYPOGRAPHY.pRegular} paddingBottom={SPACING.spacing3}>
          {t('analytics_description')}
        </Text>
      </Box>
      <ToggleButton
        label="analytics_opt_in"
        size={SIZE_2}
        toggledOn={analyticsOptedIn}
        onClick={() => dispatch(toggleAnalyticsOptedIn())}
        id="PrivacySettings_analytics"
      />
    </Flex>
  )
}
