import * as fs from 'fs'
import * as path from 'path'
import {getStringInput} from '../../helpers'
import {TestProjectFolder} from './getTestProjectFolders'

export function getProjectDlls(projectFolders: TestProjectFolder[]): string[] {
  const projectDlls: string[] = []
  const configuration = getStringInput('configuration', {
    defaultValue: 'find'
  }).toLowerCase()

  for (const projectFolder of projectFolders) {
    let projectDll: string | undefined
    let releaseDll: string
    let debugDll: string
    switch (configuration) {
      case 'find':
        releaseDll = getDll(projectFolder, 'Release')
        if (!fs.existsSync(releaseDll)) {
          debugDll = getDll(projectFolder, 'Debug')
          if (fs.existsSync(debugDll)) {
            projectDll = debugDll
          }
        } else {
          projectDll = releaseDll
        }
        break
      case 'debug':
        debugDll = getDebugDll(projectFolder)
        if (fs.existsSync(debugDll)) {
          projectDll = debugDll
        }
        break
      case 'release':
        releaseDll = getReleaseDll(projectFolder)
        if (fs.existsSync(releaseDll)) {
          projectDll = releaseDll
        }
        break
      default:
        throw new Error('unsupported configuration input')
    }
    if (projectDll === undefined) {
      throw new Error(
        `cannot find ${projectFolder.name} with configuration ${configuration}`
      )
    }
    projectDlls.push(projectDll)
  }
  return projectDlls
}
function getReleaseDll(projectFolder: TestProjectFolder): string {
  return getDll(projectFolder, 'Release')
}
function getDebugDll(projectFolder: TestProjectFolder): string {
  return getDll(projectFolder, 'Debug')
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
