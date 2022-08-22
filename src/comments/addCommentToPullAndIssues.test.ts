import {addCommentToPullAndIssues} from './addCommentToPullAndIssues'
import {setOutput} from '@actions/core'
import {useOctokit} from '../helpers/useOctokit'
import {setInput} from '../helpers/inputHelpers'
import {getPullRequestIssuesActionWorker} from '../getPullRequestIssues/getPullRequestIssuesActionWorker'
import {PullRequest} from '@octokit/webhooks-definitions/schema'

jest.mock('../getPullRequestIssues/getPullRequestIssuesActionWorker', () => {
  return {
    getPullRequestIssuesActionWorker: jest.fn().mockResolvedValue([9991, 9992])
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
jest.mock('../helpers/useOctokit', () => {
  return {
    useOctokit: jest.fn(callback => callback(mockOctokit))
  }
})
jest.mock('../helpers/inputHelpers')
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
describe('specific call order helper', () => {
  describe('getSpecificMockCallOrder', () => {
    it('should work', () => {
      const mock = jest.fn()
      const otherMock = jest.fn()
      mock(1)
      otherMock()
      mock(2, 'a')
      mock(3, 'a')
      const firstCallOrder = getSpecificMockCallOrder(mock, [1])
      expect(getSpecificMockCallOrder(mock, [2, 'a']) - firstCallOrder).toBe(2)
      expect(getSpecificMockCallOrder(mock, [3, 'a']) - firstCallOrder).toBe(3)
    })
  })
  describe('specificCalledBefore', () => {
    it('should return true when called before', () => {
      const before = jest.fn()
      const after = jest.fn()
      before(1)
      after()
      after()
      before(0)
      expect(specificCalledBefore(before, [1], after)).toBe(true)
    })

    it('should return false when called after', () => {
      const before = jest.fn()
      const after = jest.fn()
      before(1)
      after()
      after()
      before(0)
      expect(specificCalledBefore(before, [0], after)).toBe(false)
    })
  })
})
function getSpecificMockCallOrder(fn: Function, args: unknown[]): number {
  const mock = fn as jest.Mock
  const calls = mock.mock.calls
  const callNumber = calls.findIndex(beforeCall => {
    let counter = 0
    for (const arg of args) {
      if (beforeCall[counter] !== arg) {
        return false
      }
      counter++
    }
    return true
  })
  if (callNumber === -1) {
    throw new Error('before not called')
  }
  return mock.mock.invocationCallOrder[callNumber]
}

function specificCalledBefore(
  before: Function,
  args: unknown[],
  after: Function
): boolean {
  let didSpecificCalledBefore = true

  const afterMock = after as jest.Mock
  const afterInvocationCallOrder = afterMock.mock.invocationCallOrder

  const beforeCallOrder = getSpecificMockCallOrder(before, args)
  for (const afterCallOrder of afterInvocationCallOrder) {
    if (afterCallOrder <= beforeCallOrder) {
      didSpecificCalledBefore = false
      break
    }
  }

  return didSpecificCalledBefore
}

describe('hcreates comments in pull request and/or issues based upon addTo input', () => {
  const pullRequest = {number: 123}
  const comment = 'a comment'
  async function doAddCommentToPullAndIssues(): Promise<void> {
    await addCommentToPullAndIssues(
      (pullRequest as unknown) as PullRequest,
      comment
    )
  }
  beforeEach(() => {
    createCommentId = 0
  })
  it('should useOctokit with env variable', async () => {
    await addCommentToPullAndIssues(({} as unknown) as PullRequest, 'a comment')
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
      expectedIssueNumbers: [pullRequest.number]
    },
    {
      addTo: 'PuLl',
      description: 'pull only casing unimportant',
      expectedIssueNumbers: [pullRequest.number]
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
      expectedIssueNumbers: [pullRequest.number, 9991, 9992]
    },
    {
      addTo: 'PullandissueS',
      description: 'pull and issues casing unimportant',
      expectedIssueNumbers: [123, 9991, 9992]
    }
  ]

  for (const test of tests) {
    const tester = test.only ? fit : it
    tester(`${test.description}`, async () => {
      mockAddTo = test.addTo
      await doAddCommentToPullAndIssues()
      expect(mockOctokit.issues.createComment).toHaveBeenCalledTimes(
        test.expectedIssueNumbers.length
      )
      for (const expectedIssueNumber of test.expectedIssueNumbers) {
        expect(mockOctokit.issues.createComment).toHaveBeenCalledWith({
          owner: 'theowner',
          repo: 'therepo',
          issue_number: expectedIssueNumber,
          body: comment
        })
      }
      const expectedCommentIds: number[] = []
      for (let c = 0; c < test.expectedIssueNumbers.length; c++) {
        expectedCommentIds.push(c + 1)
      }
      expect(setOutput).toHaveBeenCalledWith('commentIds', expectedCommentIds)
    })
  }

  it.each(['issues', 'pullandissues'])(
    'should set the pullRequest input to be used by getPullRequestIssuesActionWorker',
    async (addToIssuesInput: string) => {
      mockAddTo = addToIssuesInput
      await doAddCommentToPullAndIssues()
      expect(
        specificCalledBefore(
          setInput,
          ['pullRequest', JSON.stringify({pull_request: pullRequest})],
          getPullRequestIssuesActionWorker
        )
      ).toBe(true)
    }
  )
})
