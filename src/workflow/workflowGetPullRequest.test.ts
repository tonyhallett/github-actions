import {getStringInput, payloadOrInput} from '../helpers/inputHelpers'
import {useOctokit} from '../helpers/useOctokit'
import {workflowGetPullRequest} from './workflowGetPullRequest'

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

const mockPayloadOrInput = {
  workflow_run: {
    head_branch: 'headbranch',
    head_sha: 'headsha',
    head_repository: {
      owner: {
        login: 'ownerlogin'
      }
    }
  }
}
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
    }
  }
}
jest.mock('../helpers/useOctokit', () => {
  return {
    useOctokit: jest.fn(callback => callback(mockOctokit))
  }
})

describe('workflowGetPullRequest', () => {
  beforeEach(() => {
    mockPullState = 'open'
  })
  it('should throw for incorrect pullState input', () => {
    mockPullState = 'incorrect'
    return expect(workflowGetPullRequest()).rejects.toThrow(
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

  const pullStates = ['open', 'closed', 'all']
  pullStates.forEach(pullState => {
    it('should paginate 100 pulls filtered by branch and state', async () => {
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
    })
  })

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
