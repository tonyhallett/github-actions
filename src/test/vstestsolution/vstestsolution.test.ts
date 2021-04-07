import * as tryCatchFailed from '../../../src/helpers/tryCatchSetFailed'
import {getProjectDlls} from './getProjectDlls'
import {getTestProjectFolders} from './getTestProjectFolders'
import {vsTestSolutionAction} from './vstestsolution'
import * as exec from '@actions/exec'

const trySetCatchFailedSpy = jest.spyOn(tryCatchFailed, 'trySetFailedAsync')

jest.mock('@actions/exec')
jest.mock('./getSolutionFile', () => {
  return {
    getSolutionFile: jest.fn().mockReturnValue('asoln.sln')
  }
})
jest.mock('./getTestProjectFolders', () => {
  return {
    getTestProjectFolders: jest.fn().mockResolvedValue([
      {path: 'path1', name: 'name1'},
      {path: 'path2', name: 'name2'}
    ])
  }
})
jest.mock('./getProjectDlls', () => {
  return {
    getProjectDlls: jest.fn().mockReturnValue(['one.dll', 'two.dll'])
  }
})
describe('vsTestSolutionAction', () => {
  it('should trySetFailedAsync', async () => {
    await vsTestSolutionAction()
    expect(trySetCatchFailedSpy).toHaveBeenCalledWith(expect.any(Function))
  })
  it('should get test project folders for the solution file', async () => {
    await vsTestSolutionAction()
    expect(getTestProjectFolders).toHaveBeenCalledWith('asoln.sln')
  })
  it('should get project dlls from the project folders', async () => {
    await vsTestSolutionAction()
    expect(getProjectDlls).toHaveBeenCalledWith([
      {path: 'path1', name: 'name1'},
      {path: 'path2', name: 'name2'}
    ])
  })
  it('should execute vstest.console.exe with the test project dlls', async () => {
    await vsTestSolutionAction()
    expect(exec.exec).toHaveBeenCalledWith('vstest.console.exe', [
      'one.dll',
      'two.dll'
    ])
  })
})
