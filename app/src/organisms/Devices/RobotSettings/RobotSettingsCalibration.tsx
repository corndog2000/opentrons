import * as React from 'react'
import { useSelector } from 'react-redux'
import { saveAs } from 'file-saver'
import { useTranslation } from 'react-i18next'

import {
  Box,
  Flex,
  Link,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  TEXT_DECORATION_UNDERLINE,
  useHoverTooltip,
  TOOLTIP_LEFT,
  useConditionalConfirm,
  Mount,
} from '@opentrons/components'

import { Portal } from '../../../App/portal'
import { TertiaryButton } from '../../../atoms/buttons'
import { Line } from '../../../atoms/structure'
import { StyledText } from '../../../atoms/text'
import { Banner } from '../../../atoms/Banner'
import { Tooltip } from '../../../atoms/Tooltip'
import { DeckCalibrationModal } from '../../../organisms/ProtocolSetup/RunSetupCard/RobotCalibration/DeckCalibrationModal'
import { CalibrateDeck } from '../../../organisms/CalibrateDeck'
import { formatLastModified } from '../../../organisms/CalibrationPanels/utils'
import { AskForCalibrationBlockModal } from '../../../organisms/CalibrateTipLength/AskForCalibrationBlockModal'

import { useTrackEvent } from '../../../redux/analytics'
import { EVENT_CALIBRATION_DOWNLOADED } from '../../../redux/calibration'
import { getDeckCalibrationSession } from '../../../redux/sessions/deck-calibration/selectors'
import { CONNECTABLE } from '../../../redux/discovery'
import { selectors as robotSelectors } from '../../../redux/robot'
import * as RobotApi from '../../../redux/robot-api'
import * as Config from '../../../redux/config'
import * as Sessions from '../../../redux/sessions'
import {
  useDeckCalibrationData,
  usePipetteOffsetCalibrations,
  useRobot,
  useTipLengthCalibrations,
  useAttachedPipettes,
} from '../hooks'
import { DeckCalibrationConfirmModal } from './DeckCalibrationConfirmModal'
import { PipetteOffsetCalibrationItems } from './CalibrationDetails/PipetteOffsetCalibrationItems'
import { TipLengthCalibrationItems } from './CalibrationDetails/TipLengthCalibrationItems'

import type { State } from '../../../redux/types'
import type { RequestState } from '../../../redux/robot-api/types'
import type {
  SessionCommandString,
  DeckCalibrationSession,
} from '../../../redux/sessions/types'
import type { DeckCalibrationInfo } from '../../../redux/calibration/types'

interface CalibrationProps {
  robotName: string
}

export interface FormattedPipetteOffsetCalibration {
  modelName?: string
  serialNumber?: string
  mount: Mount
  tiprack?: string
  lastCalibrated?: string
  markedBad?: boolean
}

export interface FormattedTipLengthCalibration {
  tiprack: string
  pipette: string
  lastCalibrated: string
  markedBad: boolean
  uri?: string | null
}

const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]

export function RobotSettingsCalibration({
  robotName,
}: CalibrationProps): JSX.Element {
  const { t } = useTranslation([
    'device_settings',
    'robot_calibration',
    'shared',
  ])
  const doTrackEvent = useTrackEvent()
  const trackedRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })

  const [
    showDeckCalibrationModal,
    setShowDeckCalibrationModal,
  ] = React.useState(false)
  const [
    showPipetteOffsetCalibrationBanner,
    setShowPipetteOffsetCalibrationBanner,
  ] = React.useState<boolean>(false)
  const [
    pipetteOffsetCalBannerType,
    setPipetteOffsetCalBannerType,
  ] = React.useState<string>('')

  const [showCalBlockModal, setShowCalBlockModal] = React.useState(false)

  const robot = useRobot(robotName)
  const notConnectable = robot?.status !== CONNECTABLE

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (dispatchedAction.type === Sessions.ENSURE_SESSION) {
        createRequestId.current =
          'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      } else if (
        dispatchedAction.type === Sessions.CREATE_SESSION_COMMAND &&
        dispatchedAction.payload.command.command ===
          Sessions.sharedCalCommands.JOG
      ) {
        jogRequestId.current =
          'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      } else if (
        dispatchedAction.type !== Sessions.CREATE_SESSION_COMMAND ||
        !spinnerCommandBlockList.includes(
          dispatchedAction.payload.command.command
        )
      ) {
        trackedRequestId.current =
          'meta' in dispatchedAction && 'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      }
    }
  )

  // wait for robot request to resolve instead of using name directly from params
  const deckCalibrationData = useDeckCalibrationData(robot?.name)
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations(robot?.name)
  const tipLengthCalibrations = useTipLengthCalibrations(robot?.name)
  const attachedPipettes = useAttachedPipettes(
    robot?.name != null ? robot.name : null
  )

  const isRunning = useSelector(robotSelectors.getIsRunning)

  const pipettePresent =
    attachedPipettes != null
      ? !(attachedPipettes.left == null) || !(attachedPipettes.right == null)
      : false

  const isPending =
    useSelector<State, RequestState | null>(state =>
      trackedRequestId.current != null
        ? RobotApi.getRequestById(state, trackedRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const createRequest = useSelector((state: State) =>
    createRequestId.current != null
      ? RobotApi.getRequestById(state, createRequestId.current)
      : null
  )
  const createStatus = createRequest?.status

  const configHasCalibrationBlock = useSelector(Config.getHasCalibrationBlock)

  const isJogging =
    useSelector((state: State) =>
      jogRequestId.current != null
        ? RobotApi.getRequestById(state, jogRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const handleStartDeckCalSession = (): void => {
    dispatchRequests(
      Sessions.ensureSession(robotName, Sessions.SESSION_TYPE_DECK_CALIBRATION)
    )
  }

  const pipOffsetDataPresent =
    pipetteOffsetCalibrations != null
      ? pipetteOffsetCalibrations.length > 0
      : false

  const deckCalibrationSession: DeckCalibrationSession | null = useSelector(
    (state: State) => {
      return getDeckCalibrationSession(state, robotName)
    }
  )

  const {
    showConfirmation: showConfirmStart,
    confirm: confirmStart,
    cancel: cancelStart,
  } = useConditionalConfirm(handleStartDeckCalSession, !!pipOffsetDataPresent)

  let buttonDisabledReason = null
  if (notConnectable) {
    buttonDisabledReason = t('shared:disabled_cannot_connect')
  } else if (isRunning) {
    buttonDisabledReason = t('shared:disabled_protocol_is_running')
  } else if (!pipettePresent) {
    buttonDisabledReason = t('shared:disabled_no_pipette_attached')
  }

  const healthCheckButtonDisabled = Boolean(buttonDisabledReason) || isPending

  const onClickSaveAs: React.MouseEventHandler = e => {
    e.preventDefault()
    doTrackEvent({
      name: EVENT_CALIBRATION_DOWNLOADED,
      properties: {},
    })
    saveAs(
      new Blob([
        JSON.stringify({
          deck: deckCalibrationData,
          pipetteOffset: pipetteOffsetCalibrations,
          tipLength: tipLengthCalibrations,
        }),
      ]),
      `opentrons-${robotName}-calibration.json`
    )
  }

  const deckCalibrationButtonText = deckCalibrationData.isDeckCalibrated
    ? t('deck_calibration_recalibrate_button')
    : t('deck_calibration_calibrate_button')

  const disabledOrBusyReason = isPending
    ? t('robot_calibration:deck_calibration_spinner', {
        ongoing_action:
          createStatus === RobotApi.PENDING
            ? t('shared:starting')
            : t('shared:ending'),
      })
    : buttonDisabledReason

  const deckLastModified = (): string => {
    const deckCalData = deckCalibrationData.deckCalibrationData as DeckCalibrationInfo
    const calibratedDate = deckCalData?.lastModified ?? null
    return Boolean(calibratedDate)
      ? t('last_calibrated', {
          date: formatLastModified(calibratedDate),
        })
      : t('not_calibrated')
  }

  const handleHealthCheck = (
    hasBlockModalResponse: boolean | null = null
  ): void => {
    if (hasBlockModalResponse === null && configHasCalibrationBlock === null) {
      setShowCalBlockModal(true)
    } else {
      setShowCalBlockModal(false)
      dispatchRequests(
        Sessions.ensureSession(
          robotName,
          Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
          {
            tipRacks: [],
            hasCalibrationBlock: Boolean(
              configHasCalibrationBlock ?? hasBlockModalResponse
            ),
          }
        )
      )
    }
  }

  const formatPipetteOffsetCalibrations = (): FormattedPipetteOffsetCalibration[] => {
    const pippets = []
    if (attachedPipettes != null) {
      pippets.push({
        modelName: attachedPipettes.left?.modelSpecs?.displayName,
        serialNumber: attachedPipettes.left?.id,
        mount: 'left' as Mount,
        tiprack: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.left?.id
        )?.tiprackUri,
        lastCalibrated: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.left?.id
        )?.lastModified,
        markedBad: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.left?.id
        )?.status.markedBad,
      })
      pippets.push({
        modelName: attachedPipettes.right?.modelSpecs?.displayName,
        serialNumber: attachedPipettes.right?.id,
        mount: 'right' as Mount,
        tiprack: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.right?.id
        )?.tiprackUri,
        lastCalibrated: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.right?.id
        )?.lastModified,
        markedBad: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.right?.id
        )?.status.markedBad,
      })
    }
    return pippets
  }

  const formatTipLengthCalibrations = (): FormattedTipLengthCalibration[] => {
    const tipLengths: FormattedTipLengthCalibration[] = []
    tipLengthCalibrations?.map(tipLength =>
      tipLengths.push({
        tiprack: tipLength.tiprack,
        pipette: tipLength.pipette,
        lastCalibrated: tipLength.lastModified,
        markedBad: tipLength.status.markedBad,
        uri: tipLength.uri,
      })
    )
    return tipLengths
  }

  const checkPipetteCalibrationMissing = (): void => {
    if (
      pipetteOffsetCalibrations === null ||
      Object.values(pipetteOffsetCalibrations).length <= 1
    ) {
      setShowPipetteOffsetCalibrationBanner(true)
      setPipetteOffsetCalBannerType('error')
    } else {
      const left = attachedPipettes?.left?.id
      const right = attachedPipettes?.right?.id
      const markedBads =
        pipetteOffsetCalibrations?.filter(
          p =>
            (p.pipette === left && p.status.markedBad) ||
            (p.pipette === right && p.status.markedBad)
        ) ?? null
      if (markedBads !== null) {
        setShowPipetteOffsetCalibrationBanner(true)
        setPipetteOffsetCalBannerType('warning')
      } else {
        setShowPipetteOffsetCalibrationBanner(false)
      }
    }
  }

  React.useEffect(() => {
    if (createStatus === RobotApi.SUCCESS) {
      createRequestId.current = null
    }
  }, [createStatus])

  React.useEffect(() => {
    checkPipetteCalibrationMissing()
  }, [pipettePresent, pipetteOffsetCalibrations])

  return (
    <>
      <Portal level="top">
        <CalibrateDeck
          session={deckCalibrationSession}
          robotName={robotName}
          dispatchRequests={dispatchRequests}
          showSpinner={isPending}
          isJogging={isJogging}
        />
        {showCalBlockModal ? (
          <AskForCalibrationBlockModal
            onResponse={handleHealthCheck}
            titleBarTitle={t('robot_calibration:health_check_title')}
            closePrompt={() => setShowCalBlockModal(false)}
          />
        ) : null}
        {showConfirmStart && pipOffsetDataPresent && (
          <DeckCalibrationConfirmModal
            confirm={confirmStart}
            cancel={cancelStart}
          />
        )}
      </Portal>
      <Box paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('about_calibration_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing3}>
              {t('about_calibration_description')}
            </StyledText>
            {showDeckCalibrationModal ? (
              <DeckCalibrationModal
                onCloseClick={() => setShowDeckCalibrationModal(false)}
              />
            ) : null}
            <Link
              css={TYPOGRAPHY.linkPSemiBold}
              onClick={() => setShowDeckCalibrationModal(true)}
            >
              {t('see_how_robot_calibration_works')}
            </Link>
          </Box>
          <TertiaryButton onClick={onClickSaveAs}>
            {t('download_calibration_data')}
          </TertiaryButton>
        </Flex>
      </Box>
      <Line />
      {showPipetteOffsetCalibrationBanner && (
        <Banner
          type={pipetteOffsetCalBannerType === 'error' ? 'error' : 'warning'}
        >
          {pipetteOffsetCalBannerType === 'error'
            ? t('pipette_offset_calibration_missing')
            : t('pipette_offset_calibration_recommended')}
        </Banner>
      )}
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('pipette_offset_calibrations_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing4}>
              {t('pipette_offset_calibrations_description')}
            </StyledText>
            {pipetteOffsetCalibrations != null ? (
              <PipetteOffsetCalibrationItems
                robotName={robotName}
                formattedPipetteOffsetCalibrations={formatPipetteOffsetCalibrations()}
              />
            ) : (
              <StyledText as="label">{t('not_calibrated')}</StyledText>
            )}
          </Box>
        </Flex>
      </Box>
      <Line />
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('tip_length_calibrations_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing4}>
              {t('tip_length_calibrations_description')}
            </StyledText>
            {tipLengthCalibrations != null &&
            tipLengthCalibrations.length !== 0 ? (
              <TipLengthCalibrationItems
                robotName={robotName}
                formattedPipetteOffsetCalibrations={formatPipetteOffsetCalibrations()}
                formattedTipLengthCalibrations={formatTipLengthCalibrations()}
              />
            ) : (
              <StyledText as="label">{t('not_calibrated')}</StyledText>
            )}
          </Box>
        </Flex>
      </Box>
      {deckCalibrationButtonText === t('deck_calibration_calibrate_button') && (
        <Banner type="error">
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
            <StyledText as="p">{t('deck_calibration_missing')}</StyledText>
            <Link
              role="button"
              color={COLORS.darkBlack}
              css={TYPOGRAPHY.pRegular}
              textDecoration={TEXT_DECORATION_UNDERLINE}
              onClick={() => confirmStart()}
            >
              {t('calibrate_now')}
            </Link>
          </Flex>
        </Banner>
      )}
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('deck_calibration_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing3}>
              {t('deck_calibration_description')}
            </StyledText>
            <StyledText as="label">{deckLastModified()}</StyledText>
          </Box>
          <TertiaryButton
            onClick={() => confirmStart()}
            disabled={disabledOrBusyReason !== null}
          >
            {deckCalibrationButtonText}
          </TertiaryButton>
        </Flex>
      </Box>
      <Line />
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('calibration_health_check_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing3}>
              {t('calibration_health_check_description')}
            </StyledText>
          </Box>
          <TertiaryButton
            {...targetProps}
            onClick={() => handleHealthCheck(null)}
            disabled={healthCheckButtonDisabled}
          >
            {t('health_check_button')}
          </TertiaryButton>
          {healthCheckButtonDisabled && (
            <Tooltip tooltipProps={tooltipProps}>
              {t('fully_calibrate_before_checking_health')}
            </Tooltip>
          )}
        </Flex>
      </Box>
    </>
  )
}
