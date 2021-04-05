import * as core from '@actions/core'
import {trySetFailedAsync} from './tryCatchSetFailed'
jest.mock('@actions/core')
describe('trySetFailedAsync', () => {
  it('should execute action and setFailed with error if error', async () => {
    const error = new Error('errored')
    await trySetFailedAsync(() => {
      throw error
    })
    expect(core.setFailed).toHaveBeenCalledWith(error)
  })

  it('should not setFailed if no error', async () => {
    const asyncFunction = jest.fn().mockReturnValue(Promise.resolve())
    await trySetFailedAsync(asyncFunction)
    expect(asyncFunction).toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
  })
})
