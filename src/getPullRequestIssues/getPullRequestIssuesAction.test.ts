import {setOutput, setFailed} from '@actions/core'
import {getPullRequestIssuesAction} from './getPullRequestIssuesAction'
let mockThrow = false
const mockError = new Error('errored')
jest.mock('./getPullRequestIssuesActionWorker', () => {
  return {
    getPullRequestIssuesActionWorker: jest.fn(async () => {
      if (mockThrow) {
        throw mockError
      }
      return [1, 2]
    })
  }
})

jest.mock('@actions/core')

describe('getPullRequestIssuesAction', () => {
  it('should setFailed when errors', async () => {
    mockThrow = true
    await getPullRequestIssuesAction()
    expect(setFailed).toHaveBeenCalledWith(mockError)
  })
  it('should set issues output', async () => {
    mockThrow = false
    await getPullRequestIssuesAction()
    expect(setOutput).toHaveBeenCalledWith('issues', [1, 2])
  })
})
