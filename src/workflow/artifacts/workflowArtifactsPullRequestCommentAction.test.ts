import {setFailed, setOutput} from '@actions/core'
import {useOctokit} from '../../helpers'
import {getBoolInput, setInput} from '../../helpers/inputHelpers'
import {pullStateInputName} from '../workflowGetPullRequest'
import {workflowArtifactsPullRequestCommentAction} from './workflowArtifactsPullRequestCommentAction'
let mockWorkflowArtifactsComment: string | undefined
let mockThrow = false
const mockError = new Error('errored')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockPullRequest: any
let mockErrorNoArtifacts = false

jest.mock('../../getPullRequestIssues/getPullRequestIssuesActionWorker', () => {
  return {
    getPullRequestIssuesActionWorker: jest.fn().mockResolvedValue([9991, 9992])
  }
})

jest.mock('@actions/github', () => {
  return {
    context: {
      repo: {
        owner: 'theowner',
        repo: 'therepo'
      }
    }
  }
})
jest.mock('../../helpers/inputHelpers', () => {
  return {
    getBoolInput: jest.fn((inputName: string) => {
      if (inputName === 'errorNoArtifacts') {
        return mockErrorNoArtifacts
      }
      throw new Error('unexpected input')
    }),
    setInput: jest.fn()
  }
})
let mockAddTo = ''
jest.mock('@actions/core', () => {
  return {
    getInput: jest.fn(() => {
      return mockAddTo
    }),
    setFailed: jest.fn(),
    info: jest.fn(),
    setOutput: jest.fn()
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
let createCommentId = 0
const mockOctokit = {
  issues: {
    createComment: jest.fn(async () => {
      createCommentId++
      return {
        data: {
          id: createCommentId
        }
      }
    })
  }
}
jest.mock('./getWorkflowArtifactsComment', () => {
  return {
    getWorkflowArtifactsComment: jest.fn(() => {
      return mockWorkflowArtifactsComment
    })
  }
})
jest.mock('../../helpers/useOctokit', () => {
  return {
    useOctokit: jest.fn(callback => callback(mockOctokit))
  }
})

function expectSetFailedError(expectedMessage: string): void {
  const setFailedMock = setFailed as jest.Mock
  const setFailedError: Error = setFailedMock.mock.calls[0][0]
  expect(setFailedError).toBeInstanceOf(Error)
  expect(setFailedError.message).toBe(expectedMessage)
}

describe('workflowArtifactsPullRequestCommentAction', () => {
  const definedPullRequest = {number: 123}
  const definedArtfactsComment = 'The artifacts comment'
  beforeEach(() => {
    mockThrow = false
    mockPullRequest = definedPullRequest
    createCommentId = 0
    mockWorkflowArtifactsComment = definedArtfactsComment
  })
  it('should setFailed when errors', async () => {
    mockThrow = true
    await workflowArtifactsPullRequestCommentAction()
    expect(setFailed).toHaveBeenCalledWith(mockError)
  })
  it('should set pullState input to open pull requests for workflowGetPullRequest', async () => {
    await workflowArtifactsPullRequestCommentAction()
    expect(setInput).toHaveBeenCalledWith(pullStateInputName, 'open')
  })
  it('should setFailed if no pull request', async () => {
    mockPullRequest = undefined
    await workflowArtifactsPullRequestCommentAction()
    expectSetFailedError('no pull request')
  })

  describe('no artifacts', () => {
    beforeEach(() => {
      mockWorkflowArtifactsComment = undefined
    })
    it('should setFailed if input errorNoArtifacts ( default true )', async () => {
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

  describe('has artifacts comment - creates comments in pull request and/or issues based upon addTo input', () => {
    it('should useOctokit with env variable', async () => {
      await workflowArtifactsPullRequestCommentAction()
      expect(useOctokit).toHaveBeenCalledWith(expect.any(Function))
    })

    interface CreatingArtifactsCommentInPullOrIssuesTest {
      addTo: string
      expectedIssueNumbers: number[]
      description: string
      only?: boolean
    }

    const tests: CreatingArtifactsCommentInPullOrIssuesTest[] = [
      {
        addTo: 'pull',
        description: 'pull only',
        expectedIssueNumbers: [123]
      },
      {
        addTo: 'PuLl',
        description: 'pull only casing unimportant',
        expectedIssueNumbers: [123]
      },
      {
        addTo: 'issues',
        description: 'issue only',
        expectedIssueNumbers: [9991, 9992]
      },
      {
        addTo: 'IssueS',
        description: 'issue only casing unimportant',
        expectedIssueNumbers: [9991, 9992]
      },
      {
        addTo: 'pullandissues',
        description: 'pull and issues',
        expectedIssueNumbers: [123, 9991, 9992]
      },
      {
        addTo: 'PullandissueS',
        description: 'pull and issues casing unimportant',
        expectedIssueNumbers: [123, 9991, 9992]
      }
    ]

    tests.forEach(test => {
      const tester = test.only ? fit : it
      tester(`${test.description}`, async () => {
        mockAddTo = test.addTo
        await workflowArtifactsPullRequestCommentAction()
        expect(mockOctokit.issues.createComment).toHaveBeenCalledTimes(
          test.expectedIssueNumbers.length
        )
        test.expectedIssueNumbers.forEach(expectedIssueNumber => {
          return {
            owner: 'theowner',
            repo: 'therepo',
            issue_number: expectedIssueNumber,
            body: definedArtfactsComment
          }
        })
        const expectedCommentIds = []
        for (let c = 0; c < test.expectedIssueNumbers.length; c++) {
          expectedCommentIds.push(c + 1)
        }
        expect(setOutput).toHaveBeenCalledWith('commentIds', expectedCommentIds)
      })
    })

    const addToIssuesInputs = ['issues', 'pullandissues']
    addToIssuesInputs.forEach(addToIssuesInput => {
      it('should set the pullRequest input to be used by getPullRequestIssuesActionWorker', async () => {
        mockAddTo = addToIssuesInput
        await workflowArtifactsPullRequestCommentAction()
        expect(setInput).toHaveBeenCalledWith(
          'pullRequest',
          JSON.stringify(definedPullRequest)
        )
      })
    })
  })
})
