import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { COLORS, FONT_SIZE_CAPTION, Text } from '@opentrons/components'
import {
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
} from '@opentrons/shared-data/js/constants'
import { StatusLabel } from '../../../atoms/StatusLabel'
import type { MagneticStatus } from '../../../redux/modules/api-types'

interface MagModuleProps {
  moduleStatus: MagneticStatus
  moduleHeight: number
  moduleModel: typeof MAGNETIC_MODULE_V1 | typeof MAGNETIC_MODULE_V2
}

export const MagneticModuleData = (
  props: MagModuleProps
): JSX.Element | null => {
  const { moduleStatus, moduleHeight, moduleModel } = props
  const { t } = useTranslation('device_details')

  return (
    <>
      <StatusLabel
        status={moduleStatus}
        backgroundColor={COLORS.medBlue}
        iconColor={COLORS.blue}
        pulse={moduleStatus === 'engaged'}
      />
      <Text fontSize={FONT_SIZE_CAPTION} data-testid={`mag_module_data`}>
        {t(
          moduleModel === MAGNETIC_MODULE_V2
            ? 'magdeck_gen2_height'
            : 'magdeck_gen1_height',
          {
            height: moduleHeight,
          }
        )}
      </Text>
    </>
  )
}
