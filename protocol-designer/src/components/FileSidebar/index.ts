import { connect } from 'react-redux'
import { i18n } from '../../localization'
import { actions, selectors } from '../../navigation'
import { selectors as fileDataSelectors } from '../../file-data'
import { selectors as stepFormSelectors } from '../../step-forms'
import {
  actions as loadFileActions,
  selectors as loadFileSelectors,
} from '../../load-file'
import { FileSidebar as FileSidebarComponent, Props } from './FileSidebar'
import type { BaseState, ThunkDispatch } from '../../types'
import type { SavedStepFormState, InitialDeckSetup } from '../../step-forms'

interface SP {
  canDownload: boolean
  fileData: Props['fileData']
  _canCreateNew?: boolean | null
  _hasUnsavedChanges?: boolean | null
  pipettesOnDeck: InitialDeckSetup['pipettes']
  modulesOnDeck: InitialDeckSetup['modules']
  savedStepForms: SavedStepFormState
  schemaVersion: 6
}
export const FileSidebar = connect(
  mapStateToProps,
  // @ts-expect-error(sa, 2021-6-21): TODO: refactor to use hooks api
  null,
  mergeProps
)(FileSidebarComponent)

function mapStateToProps(state: BaseState): SP {
  const fileData = fileDataSelectors.createFile(state)
  const canDownload = selectors.getCurrentPage(state) !== 'file-splash'
  const initialDeckSetup = stepFormSelectors.getInitialDeckSetup(state)
  return {
    canDownload,
    fileData,
    pipettesOnDeck: initialDeckSetup.pipettes,
    modulesOnDeck: initialDeckSetup.modules,
    savedStepForms: stepFormSelectors.getSavedStepForms(state),
    // Ignore clicking 'CREATE NEW' button in these cases
    _canCreateNew: !selectors.getNewProtocolModal(state),
    _hasUnsavedChanges: loadFileSelectors.getHasUnsavedChanges(state),
    schemaVersion: 6,
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: {
    dispatch: ThunkDispatch<any>
  }
): Props {
  const {
    _canCreateNew,
    _hasUnsavedChanges,
    canDownload,
    fileData,
    pipettesOnDeck,
    modulesOnDeck,
    savedStepForms,
    schemaVersion,
  } = stateProps
  const { dispatch } = dispatchProps
  return {
    loadFile: fileChangeEvent => {
      if (
        !_hasUnsavedChanges ||
        window.confirm(i18n.t('alert.window.confirm_import'))
      ) {
        dispatch(loadFileActions.loadProtocolFile(fileChangeEvent))
      }
    },
    canDownload,
    createNewFile: _canCreateNew
      ? () => dispatch(actions.toggleNewProtocolModal(true))
      : undefined,
    onDownload: () => dispatch(loadFileActions.saveProtocolFile()),
    fileData,
    pipettesOnDeck,
    modulesOnDeck,
    savedStepForms,
    schemaVersion,
  }
}
