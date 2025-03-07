import fse from 'fs-extra'
import path from 'path'
import { shell } from 'electron'

import { UI_INITIALIZED } from '@opentrons/app/src/redux/shell/actions'
import * as ProtocolStorageActions from '@opentrons/app/src/redux/protocol-storage/actions'

import * as FileSystem from './file-system'

import type { ProtocolListActionSource as ListSource } from '@opentrons/app/src/redux/protocol-storage/types'

import type { Action, Dispatch } from '../types'

const ensureDir: (dir: string) => Promise<void> = fse.ensureDir

const getUnixTimeFromAnalysisPath = (analysisPath: string): number =>
  Number(path.basename(analysisPath, path.extname(analysisPath)))

const fetchProtocols = (
  dispatch: Dispatch,
  source: ListSource
): Promise<void> => {
  return ensureDir(FileSystem.PROTOCOLS_DIRECTORY_PATH)
    .then(() =>
      FileSystem.readDirectoriesWithinDirectory(
        FileSystem.PROTOCOLS_DIRECTORY_PATH
      )
    )
    .then(FileSystem.parseProtocolDirs)
    .then(storedProtocols => {
      const storedProtocolsData = storedProtocols.map(storedProtocolDir => {
        const mostRecentAnalysisFilePath = storedProtocolDir.analysisFilePaths.reduce<
          string | null
        >((acc, analysisFilePath) => {
          if (acc !== null) {
            if (
              getUnixTimeFromAnalysisPath(analysisFilePath) >
              getUnixTimeFromAnalysisPath(acc)
            ) {
              return analysisFilePath
            }
            return acc
          }
          return analysisFilePath
        }, null)
        return {
          protocolKey: path.parse(storedProtocolDir.dirPath).base,
          modified: storedProtocolDir.modified,
          srcFileNames: storedProtocolDir.srcFilePaths.map(
            filePath => path.parse(filePath).base
          ),
          srcFiles: storedProtocolDir.srcFilePaths.map(srcFilePath => {
            const buffer = fse.readFileSync(srcFilePath)
            return Buffer.from(buffer, buffer.byteOffset, buffer.byteLength)
          }),
          mostRecentAnalysis:
            mostRecentAnalysisFilePath != null
              ? fse.readJsonSync(mostRecentAnalysisFilePath)
              : null,
        }
      })
      dispatch(
        ProtocolStorageActions.updateProtocolList(storedProtocolsData, source)
      )
    })
    .catch((error: Error) => {
      dispatch(
        ProtocolStorageActions.updateProtocolListFailure(error.message, source)
      )
    })
}

export function registerProtocolStorage(dispatch: Dispatch): Dispatch {
  return function handleActionForProtocolStorage(action: Action) {
    switch (action.type) {
      case ProtocolStorageActions.FETCH_PROTOCOLS:
      case UI_INITIALIZED: {
        const source =
          action.type === ProtocolStorageActions.FETCH_PROTOCOLS
            ? ProtocolStorageActions.POLL
            : ProtocolStorageActions.INITIAL
        fetchProtocols(dispatch, source)
        break
      }

      case ProtocolStorageActions.ADD_PROTOCOL: {
        FileSystem.addProtocolFile(
          action.payload.protocolFilePath,
          FileSystem.PROTOCOLS_DIRECTORY_PATH
        ).then(protocolKey => {
          fetchProtocols(dispatch, ProtocolStorageActions.PROTOCOL_ADDITION)
          dispatch(ProtocolStorageActions.analyzeProtocol(protocolKey))
        })
        break
      }

      case ProtocolStorageActions.ANALYZE_PROTOCOL: {
        FileSystem.analyzeProtocolByKey(
          action.payload.protocolKey,
          FileSystem.PROTOCOLS_DIRECTORY_PATH
        )
          .then(() => {
            dispatch(
              ProtocolStorageActions.analyzeProtocolSuccess(
                action.payload.protocolKey
              )
            )
            return fetchProtocols(
              dispatch,
              ProtocolStorageActions.PROTOCOL_ADDITION
            )
          })
          .catch((_e: Error) => {
            dispatch(
              ProtocolStorageActions.analyzeProtocolFailure(
                action.payload.protocolKey
              )
            )
          })
        break
      }

      case ProtocolStorageActions.REMOVE_PROTOCOL: {
        FileSystem.removeProtocolByKey(
          action.payload.protocolKey,
          FileSystem.PROTOCOLS_DIRECTORY_PATH
        ).then(() =>
          fetchProtocols(dispatch, ProtocolStorageActions.PROTOCOL_ADDITION)
        )
        break
      }

      case ProtocolStorageActions.VIEW_PROTOCOL_SOURCE_FOLDER: {
        FileSystem.viewProtocolSourceFolder(
          action.payload.protocolKey,
          FileSystem.PROTOCOLS_DIRECTORY_PATH
        )
        break
      }

      case ProtocolStorageActions.OPEN_PROTOCOL_DIRECTORY: {
        shell.openPath(FileSystem.PROTOCOLS_DIRECTORY_PATH)
        break
      }
    }
  }
}
