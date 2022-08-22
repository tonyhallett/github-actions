import {getStringInput, payloadOrInput} from '../helpers/inputHelpers'
import {useOctokit} from '../helpers/useOctokit'
import {
  getPullRequestNumberFromCommitMessage,
  workflowGetPullRequest
} from './workflowGetPullRequest'

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

let mockPayloadOrInput: unknown
let mockPullState = ''
jest.mock('../helpers/inputHelpers', () => {
  return {
    payloadOrInput: jest.fn((inputName: string) => {
      if (inputName === 'workflowPayload') {
        return mockPayloadOrInput
      }
    }),
    getStringInput: jest.fn((inputName: string) => {
      if (inputName === 'pullState') {
        return mockPullState
      }
    })
  }
})
const mockGetPullRequestResponse = {
  data: {
    pullrequest: 'fields'
  }
}
const mockOctokit = {
  paginate: jest.fn().mockResolvedValue([
    {
      head: {
        sha: 'nomatch'
      }
    },
    {
      head: {
        sha: 'headsha'
      },
      matchingPullReques: true
    }
  ]),
  pulls: {
    list: {
      endpoint: '....'
    },
    get: jest.fn().mockResolvedValue(mockGetPullRequestResponse)
  }
}
jest.mock('../helpers/useOctokit', () => {
  return {
    useOctokit: jest.fn(callback => callback(mockOctokit))
  }
})

describe('workflowGetPullRequest', () => {
  describe('pull request workflow', () => {
    beforeEach(() => {
      mockPullState = 'open'
      mockPayloadOrInput = {
        workflow_run: {
          head_branch: 'headbranch',
          head_sha: 'headsha',
          head_repository: {
            owner: {
              login: 'ownerlogin'
            }
          },
          event: 'pull_request'
        }
      }
    })
    it('should throw for incorrect pullState input', async () => {
      mockPullState = 'incorrect'
      await expect(workflowGetPullRequest).rejects.toThrow(
        'Incorrect pullState input - allowed all | closed | open'
      )
    })

    it('should default the pull state to all', async () => {
      await workflowGetPullRequest()
      expect(getStringInput).toHaveBeenCalledWith('pullState', {
        defaultValue: 'all'
      })
    })

    it('should get the payload from payload or workflowPayload input', async () => {
      await workflowGetPullRequest()
      expect(payloadOrInput).toHaveBeenCalledWith('workflowPayload')
    })

    it('should use octokit env var', async () => {
      await workflowGetPullRequest()
      expect(useOctokit).toHaveBeenCalledWith(expect.any(Function))
    })

    it.each(['open', 'closed', 'all'])(
      'should paginate 100 pulls filtered by branch and state %s',
      async (pullState: string) => {
        mockPullState = pullState
        await workflowGetPullRequest()
        expect(mockOctokit.paginate).toHaveBeenCalledWith(
          mockOctokit.pulls.list,
          {
            per_page: 100,
            repo: 'therepo',
            owner: 'theowner',
            head: 'ownerlogin:headbranch',
            state: pullState
          }
        )
      }
    )

    it('should match the pull requests by SHA', async () => {
      const pullRequest = await workflowGetPullRequest()
      expect(pullRequest).toEqual({
        head: {
          sha: 'headsha'
        },
        matchingPullReques: true
      })
    })
  })

  describe('push workflow', () => {
    describe('getPullRequestFromCommitMessage', () => {
      it('should extract the pull number from `Merge pull request #123`', () => {
        expect(getPullRequestNumberFromCommitMessage('Merge pull request #123'))
      })
      it('should throw error if does not match', () => {
        expect(() =>
          getPullRequestNumberFromCommitMessage('no match')
        ).toThrowError('commit message does not match')
      })
    })
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function getPayloadOrInput(commitMessage: string) {
      return {
        workflow_run: {
          head_branch: 'headbranch',
          head_sha: 'headsha',
          head_repository: {
            owner: {
              login: 'ownerlogin'
            }
          },
          head_commit: {
            message: commitMessage
          },
          event: 'push'
        }
      }
    }

    it('should get the pull request from the commit message', async () => {
      mockPayloadOrInput = getPayloadOrInput('Merge pull request #77')
      const pullRequest = await workflowGetPullRequest()
      expect(mockOctokit.pulls.get).toHaveBeenCalledWith({
        repo: 'therepo',
        owner: 'theowner',
        pull_number: 77
      })
      expect(pullRequest).toBe(mockGetPullRequestResponse.data)
    })
  })
  it('should throw for any other event', () => {
    mockPayloadOrInput = {
      workflow_run: {
        head_branch: 'headbranch',
        head_sha: 'headsha',
        head_repository: {
          owner: {
            login: 'ownerlogin'
          }
        },
        event: 'notpullorpush'
      }
    }
    expect(workflowGetPullRequest()).rejects.toThrowError(
      'unsupported workflow run event'
    )
  })
})
