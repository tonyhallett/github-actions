import * as exec from '@actions/exec'
import {trySetFailedAsync} from '../..'
import {getSolutionFile} from './getSolutionFile'
import {getTestProjectFolders} from './getTestProjectFolders'
import {getProjectDlls} from './getProjectDlls'
export async function vsTestSolutionAction(): Promise<void> {
  return trySetFailedAsync(async () => {
    const solutionFile = getSolutionFile()
    const projectFolders = await getTestProjectFolders(solutionFile)
    const projectDlls = getProjectDlls(projectFolders)
    await exec.exec('vstest.console.exe', projectDlls)
  })
}
