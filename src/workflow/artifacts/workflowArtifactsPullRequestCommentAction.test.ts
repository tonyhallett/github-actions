import {setFailed} from '@actions/core'
import { addCommentToPullAndIssues } from '../../comments/addCommentToPullAndIssues'
import {getBoolInput} from '../../helpers/inputHelpers'
import {workflowArtifactsPullRequestCommentAction} from './workflowArtifactsPullRequestCommentAction'
let mockWorkflowArtifactsComment: string | null
let mockThrow = false
const mockError = new Error('errored')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockPullRequest: any
let mockErrorNoArtifacts = false

jest.mock('../../comments/addCommentToPullAndIssues')

jest.mock('../../helpers/inputHelpers', () => {
  return {
    getBoolInput: jest.fn((inputName: string) => {
      if (inputName === 'errorNoArtifacts') {
        return mockErrorNoArtifacts
      }
      throw new Error('unexpected input')
    }),
  }
})

jest.mock('@actions/core', () => {
  return {
    setFailed: jest.fn(),
  }
})
jest.mock('../workflowGetPullRequest', () => {
  return {
    workflowGetPullRequest: jest.fn(async () => {
      if (mockThrow) {
        throw mockError
      }
      return mockPullRequest
    })
  }
})

jest.mock('./getWorkflowArtifactsComment', () => {
  return {
    getWorkflowArtifactsComment: jest.fn(() => {
      return mockWorkflowArtifactsComment
    })
  }
})


function expectSetFailedError(expectedMessage: string): void {
  const setFailedMock = setFailed as jest.Mock
  const setFailedError: Error = setFailedMock.mock.calls[0][0]
  expect(setFailedError).toBeInstanceOf(Error)
  expect(setFailedError.message).toBe(expectedMessage)
}

describe('workflowArtifactsPullRequestCommentAction', () => {
  beforeEach(() => {
    mockThrow = false
  })
  it('should setFailed when errors', async () => {
    mockThrow = true
    await workflowArtifactsPullRequestCommentAction()
    expect(setFailed).toHaveBeenCalledWith(mockError)
  })

  it('should setFailed if no pull request', async () => {
    mockPullRequest = undefined
    await workflowArtifactsPullRequestCommentAction()
    expectSetFailedError('no pull request')
  })

  describe('no artifacts', () => {
    beforeEach(() => {
      mockWorkflowArtifactsComment = null
      mockPullRequest = {number: 123}
    })
    it('should setFailed if input errorNoArtifacts', async () => {
      mockErrorNoArtifacts = true
      await workflowArtifactsPullRequestCommentAction()
      expect(setFailed)
    })

    it('should default errorNoArtifacts to true', async () => {
      await workflowArtifactsPullRequestCommentAction()
      expect(getBoolInput).toHaveBeenCalledWith('errorNoArtifacts', {
        defaultValue: true
      })
    })

    it('should not setFailed if errorNoArtifacts is false', async () => {
      mockErrorNoArtifacts = false
      await workflowArtifactsPullRequestCommentAction()
      expect(setFailed).not.toHaveBeenCalled()
    })
  })

  describe('has artifacts', () => {
    it('should add comment to pull and issues', async () => {
      mockWorkflowArtifactsComment = 'a comment'
      mockPullRequest = {number: 123}
      await workflowArtifactsPullRequestCommentAction()
      expect(addCommentToPullAndIssues).toHaveBeenCalledWith(mockPullRequest,'a comment')
    })
  })
})

