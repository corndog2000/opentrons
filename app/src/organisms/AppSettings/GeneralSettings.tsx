// app info card with version and updated
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'

import {
  SPACING_AUTO,
  Flex,
  useMountEffect,
  Box,
  Link,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_DECORATION_UNDERLINE,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  ALIGN_START,
} from '@opentrons/components'
import { TertiaryButton, ToggleButton } from '../../atoms/buttons'
import { ExternalLink } from '../../atoms/Link/ExternalLink'
import { Divider } from '../../atoms/structure'
import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import {
  CURRENT_VERSION,
  getAvailableShellUpdate,
  checkShellUpdate,
} from '../../redux/shell'
import {
  ALERT_APP_UPDATE_AVAILABLE,
  getAlertIsPermanentlyIgnored,
  alertPermanentlyIgnored,
  alertUnignored,
} from '../../redux/alerts'
import { useTrackEvent } from '../../redux/analytics'
import { UpdateAppModal } from '../UpdateAppModal'
import { PreviousVersionModal } from './PreviousVersionModal'
import { ConnectRobotSlideout } from './ConnectRobotSlideout'

import type { Dispatch, State } from '../../redux/types'

const SOFTWARE_SYNC_URL =
  'https://support.opentrons.com/en/articles/1795303-get-started-update-your-ot-2#:~:text=It%E2%80%99s%20important%20to%20understand,that%20runs%20your%20protocols).'

const GITHUB_LINK =
  'https://github.com/Opentrons/opentrons/blob/edge/app-shell/build/release-notes.md'

const ENABLE_APP_UPDATE_NOTIFICATIONS = 'Enable app update notifications'
const EVENT_APP_UPDATE_NOTIFICATIONS_TOGGLED = 'appUpdateNotificationsToggled'

export function GeneralSettings(): JSX.Element {
  const { t } = useTranslation(['app_settings', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const trackEvent = useTrackEvent()
  const [
    showPreviousVersionModal,
    setShowPreviousVersionModal,
  ] = React.useState(false)
  const updateAvailable = Boolean(useSelector(getAvailableShellUpdate))
  const [showUpdateModal, setShowUpdateModal] = React.useState(updateAvailable)
  const [showUpdateBanner, setShowUpdateBanner] = React.useState(
    updateAvailable
  )
  const [
    showConnectRobotSlideout,
    setShowConnectRobotSlideout,
  ] = React.useState(false)

  // may be enabled, disabled, or unknown (because config is loading)
  const enabled = useSelector((s: State) => {
    const ignored = getAlertIsPermanentlyIgnored(s, ALERT_APP_UPDATE_AVAILABLE)
    return ignored !== null ? !ignored : null
  })

  const handleToggle = (): void => {
    if (enabled !== null) {
      dispatch(
        enabled
          ? alertPermanentlyIgnored(ALERT_APP_UPDATE_AVAILABLE)
          : alertUnignored(ALERT_APP_UPDATE_AVAILABLE)
      )

      trackEvent({
        name: EVENT_APP_UPDATE_NOTIFICATIONS_TOGGLED,
        // this looks weird, but the control is a toggle, which makes the next
        // "enabled" setting `!enabled`. Therefore the next "ignored" setting is
        // `!!enabled`, or just `enabled`
        properties: { updatesIgnored: enabled },
      })
    }
  }

  useMountEffect(() => {
    dispatch(checkShellUpdate())
  })
  return (
    <>
      <Box
        height="calc(100vh - 8.5rem)"
        paddingX={SPACING.spacing4}
        paddingY={SPACING.spacing5}
      >
        {showUpdateBanner && (
          <Box
            marginBottom={SPACING.spacing4}
            id="GeneralSettings_updatebanner"
          >
            <Banner
              type="warning"
              onCloseClick={() => setShowUpdateBanner(false)}
            >
              {t('update_available')}
              <Link
                textDecoration={TEXT_DECORATION_UNDERLINE}
                onClick={() => setShowUpdateModal(true)}
              >
                {t('view_update')}
              </Link>
            </Banner>
          </Box>
        )}
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={updateAvailable ? ALIGN_CENTER : ALIGN_START}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          gridGap={SPACING.spacing4}
        >
          {showConnectRobotSlideout && (
            <ConnectRobotSlideout
              isExpanded={showConnectRobotSlideout}
              onCloseClick={() => setShowConnectRobotSlideout(false)}
            />
          )}
          <Box width="65%">
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing3}
            >
              {t('software_version')}
            </StyledText>
            <StyledText
              as="p"
              paddingBottom={SPACING.spacing3}
              id="GeneralSettings_currentVersion"
            >
              {CURRENT_VERSION}
            </StyledText>
            <StyledText as="p">
              {t('shared:view_latest_release_notes')}
              <Link
                external
                href={GITHUB_LINK}
                css={TYPOGRAPHY.linkPSemiBold}
                id="AdvancedSettings_GitHubLink"
              >{` ${t('shared:github')}`}</Link>
            </StyledText>
            <StyledText as="p" paddingY={SPACING.spacing3}>
              {t('manage_versions')}
            </StyledText>
            <Link
              role="button"
              css={TYPOGRAPHY.linkPSemiBold}
              onClick={() => setShowPreviousVersionModal(true)}
              id="GeneralSettings_previousVersionLink"
            >
              {t('restore_previous')}
            </Link>
            <StyledText as="p" paddingY={SPACING.spacing3}>
              {t('manage_versions')}
            </StyledText>
            <ExternalLink
              href={SOFTWARE_SYNC_URL}
              id="GeneralSettings_appAndRobotSync"
            >
              {t('versions_sync')}
            </ExternalLink>
          </Box>
          {updateAvailable ? (
            <TertiaryButton
              disabled={!updateAvailable}
              marginLeft={SPACING_AUTO}
              onClick={() => setShowUpdateModal(true)}
              id="GeneralSettings_softwareUpdate"
            >
              {t('view_software_update')}
            </TertiaryButton>
          ) : (
            <StyledText
              fontSize={TYPOGRAPHY.fontSizeCaption}
              lineHeight={TYPOGRAPHY.lineHeight12}
              color={COLORS.darkGreyEnabled}
              paddingY={SPACING.spacing5}
            >
              {t('up_to_date')}
            </StyledText>
          )}
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <StyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing3}
        >
          {t('update_alerts')}
        </StyledText>
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <StyledText as="p">{t('receive_alert')}</StyledText>
          <ToggleButton
            label={ENABLE_APP_UPDATE_NOTIFICATIONS}
            marginRight={SPACING.spacing4}
            disabled={enabled === null}
            toggledOn={enabled === true}
            onClick={handleToggle}
            id="GeneralSettings_softwareUpdateAlerts"
          />
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <StyledText
            css={TYPOGRAPHY.h3SemiBold}
            paddingBottom={SPACING.spacing3}
          >
            {t('connect_ip')}
          </StyledText>
          <TertiaryButton
            marginLeft={SPACING_AUTO}
            id="GeneralSettings_setUpConnection"
            onClick={() => setShowConnectRobotSlideout(true)}
          >
            {t('setup_connection')}
          </TertiaryButton>
        </Flex>
      </Box>
      {showUpdateModal ? (
        <UpdateAppModal closeModal={() => setShowUpdateModal(false)} />
      ) : null}
      {showPreviousVersionModal ? (
        <PreviousVersionModal
          closeModal={() => setShowPreviousVersionModal(false)}
        />
      ) : null}
    </>
  )
}
