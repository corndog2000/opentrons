import * as React from 'react'
import { connect } from 'react-redux'
import {
  FormGroup,
  InputField,
  Tooltip,
  useHoverTooltip,
  UseHoverTooltipTargetProps,
} from '@opentrons/components'
import { getWellsDepth } from '@opentrons/shared-data'
import {
  getIsTouchTipField,
  getIsDelayPositionField,
} from '../../../../form-types'
import { i18n } from '../../../../localization'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import stepFormStyles from '../../StepEditForm.css'
import styles from './TipPositionInput.css'
import { TipPositionModal } from './TipPositionModal'

import { getDefaultMmFromBottom } from './utils'
import { BaseState } from '../../../../types'
import { FieldProps } from '../../types'

interface OP extends FieldProps {
  labwareId?: string | null
  className?: string
}

interface SP {
  mmFromBottom: number | null
  wellDepthMm: number
}

type Props = OP & SP

function TipPositionInput(props: Props): JSX.Element {
  const [isModalOpen, setModalOpen] = React.useState(false)

  const handleOpen = (): void => {
    if (props.wellDepthMm) {
      setModalOpen(true)
    }
  }
  const handleClose = (): void => {
    setModalOpen(false)
  }

  const {
    disabled,
    name,
    mmFromBottom,
    tooltipContent,
    wellDepthMm,
    updateValue,
    isIndeterminate,
  } = props

  const isTouchTipField = getIsTouchTipField(name)
  const isDelayPositionField = getIsDelayPositionField(name)
  let value: number | string = ''
  if (wellDepthMm !== null) {
    // show default value for field in parens if no mmFromBottom value is selected
    value =
      mmFromBottom !== null
        ? mmFromBottom
        : getDefaultMmFromBottom({ name, wellDepthMm })
  }

  const [targetProps, tooltipProps] = useHoverTooltip()

  return (
    <>
      <Tooltip {...tooltipProps}>{tooltipContent}</Tooltip>
      {isModalOpen && (
        <TipPositionModal
          name={name}
          closeModal={handleClose}
          wellDepthMm={wellDepthMm}
          mmFromBottom={mmFromBottom}
          updateValue={updateValue}
          isIndeterminate={isIndeterminate}
        />
      )}
      <Wrapper
        targetProps={targetProps}
        disabled={disabled}
        isTouchTipField={isTouchTipField}
        isDelayPositionField={isDelayPositionField}
      >
        <InputField
          disabled={disabled}
          className={props.className || stepFormStyles.small_field}
          readOnly
          onClick={handleOpen}
          value={String(value)}
          isIndeterminate={isIndeterminate}
          units={i18n.t('application.units.millimeter')}
          id={`TipPositionField_${name}`}
        />
      </Wrapper>
    </>
  )
}

interface WrapperProps {
  isTouchTipField: boolean
  isDelayPositionField: boolean
  children: React.ReactNode
  disabled: boolean
  targetProps: UseHoverTooltipTargetProps
}

const Wrapper = (props: WrapperProps): JSX.Element =>
  props.isTouchTipField || props.isDelayPositionField ? (
    <div {...props.targetProps}>{props.children}</div>
  ) : (
    <span {...props.targetProps}>
      <FormGroup
        label={i18n.t('form.step_edit_form.field.tip_position.label')}
        disabled={props.disabled}
        className={styles.well_order_input}
      >
        {props.children}
      </FormGroup>
    </span>
  )

const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const { labwareId, value } = ownProps

  let wellDepthMm = 0
  if (labwareId != null) {
    const labwareDef = stepFormSelectors.getLabwareEntities(state)[labwareId]
      .def

    // NOTE: only taking depth of first well in labware def, UI not currently equipped for multiple depths
    const firstWell = labwareDef.wells.A1
    if (firstWell) wellDepthMm = getWellsDepth(labwareDef, ['A1'])
  }

  return {
    wellDepthMm,
    mmFromBottom: typeof value === 'number' ? value : null,
  }
}

export const TipPositionField = connect(mapSTP, () => ({}))(TipPositionInput)
