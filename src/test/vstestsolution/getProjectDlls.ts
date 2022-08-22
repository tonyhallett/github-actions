import * as fs from 'fs'
import * as path from 'path'
import {resolve} from 'path'
import {getStringInput} from '../../helpers'
import {TestProjectFolder} from './getTestProjectFolders'
import * as core from '@actions/core'

export function getProjectDlls(projectFolders: TestProjectFolder[]): string[] {
  let projectDlls: string[] = []
  const configuration = getStringInput('configuration', {
    defaultValue: 'find'
  }).toLowerCase()
  core.debug(`number of test folders - ${projectFolders.length} `)
  for (const projectFolder of projectFolders) {
    let thisProjectDlls: string[] = []
    switch (configuration) {
      case 'find':
        core.debug(`finding for ${projectFolder.name}`)
        thisProjectDlls = findDlls(projectFolder)
        break
      case 'debug':
        thisProjectDlls = getDlls(projectFolder, 'Debug')
        break
      case 'release':
        thisProjectDlls = getDlls(projectFolder, 'Release')
        break
      default:
        throw new Error('unsupported configuration input')
    }

    if (thisProjectDlls.length === 0) {
      throw new Error(
        `cannot find ${projectFolder.name} with configuration ${configuration}`
      )
    }
    projectDlls = projectDlls.concat(thisProjectDlls)
  }
  return projectDlls
}

function findDlls(projectFolder: TestProjectFolder): string[] {
  let dlls = getDlls(projectFolder, 'Release')
  if (dlls.length === 0) {
    dlls = getDlls(projectFolder, 'Debug')
  }
  return dlls
}

function getDlls(
  projectFolder: TestProjectFolder,
  configuration: 'Debug' | 'Release'
): string[] {
  const nonMultiTargetedPath = getDll(projectFolder, configuration)
  const nonMultiTargetedExists = fs.existsSync(nonMultiTargetedPath)
  if (nonMultiTargetedExists) {
    core.debug(`found non multi-targeted - ${nonMultiTargetedPath}`)
    return [nonMultiTargetedPath]
  }

  const dlls: string[] = []
  const projectFolderPath = projectFolder.path
  const binConfigFolderPath = getBinConfigFolder(
    projectFolderPath,
    configuration
  )
  core.debug(`bin folder path - ${binConfigFolderPath}`)
  if (fs.existsSync(binConfigFolderPath)) {
    core.debug('checking framework folders')
    const fes = fs.readdirSync(binConfigFolderPath, {withFileTypes: true})
    for (const fe of fes) {
      if (fe.isDirectory()) {
        const possibleMultiTargetedDirectory = resolve(
          binConfigFolderPath,
          fe.name
        )
        const possibleMultiTargetedDllPath = path.join(
          possibleMultiTargetedDirectory,
          `${projectFolder.name}.dll`
        )
        if (fs.existsSync(possibleMultiTargetedDllPath)) {
          dlls.push(possibleMultiTargetedDllPath)
        } else {
          core.debug(`could not find ${possibleMultiTargetedDllPath}`)
        }
      }
    }
  } else {
    core.debug(`bin folder does not exist`)
  }
  return dlls
}

function getBinConfigFolder(
  projectFolderPath: string,
  configuration: 'Debug' | 'Release'
): string {
  return path.join(projectFolderPath, 'bin', configuration)
}

function getDll(
  projectFolder: TestProjectFolder,
  configuration: string
): string {
  return path.join(
    projectFolder.path,
    'bin',
    configuration,
    `${projectFolder.name}.dll`
  )
}
