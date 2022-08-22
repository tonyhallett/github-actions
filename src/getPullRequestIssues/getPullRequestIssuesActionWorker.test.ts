import {payloadOrInput} from '../helpers/inputHelpers'
import {getPullRequestIssuesActionWorker} from './getPullRequestIssuesActionWorker'
import {getPullRequestIssues} from './getPullRequestIssues'

const mockError = new Error('error')
let mockThrow = false
const mockPullRequest = {
  is: 'from payload'
}
jest.mock('./getPullRequestIssues', () => {
  return {
    getPullRequestIssues: jest.fn(async () => {
      if (mockThrow) {
        throw mockError
      }
      return [1, 2]
    })
  }
})
let mockCaseSensitive = false
let mockUsePullTitle = false
let mockUsePullBody = false
let mockUseBranch = false
let mockUseCommitMessages = false

jest.mock('../../src/helpers/inputHelpers', () => {
  return {
    payloadOrInput: jest.fn(() => {
      return {
        pull_request: mockPullRequest
      }
    }),
    getCommaDelimitedStringArrayInput: jest.fn((input: string) => {
      switch (input) {
        case 'closeWords':
          return ['closeword1', 'closeword2']
        case 'branchIssueWords':
          return ['issueword1', 'issueword2']
        case 'branchDelimiters':
          return ['del1', 'del2']
        default:
          throw new Error('unexpected')
      }
    }),
    getBoolInput: jest.fn((input: string) => {
      switch (input) {
        case 'caseSensitive':
          return mockCaseSensitive
        case 'usePullTitle':
          return mockUsePullTitle
        case 'usePullBody':
          return mockUsePullBody
        case 'useBranch':
          return mockUseBranch
        case 'useCommitMessages':
          return mockUseCommitMessages
        default:
          throw new Error('unexpected')
      }
    })
  }
})

jest.mock('@actions/core', () => {
  const mockedCore: Partial<typeof import('@actions/core')> = {
    setFailed: jest.fn(),
    setOutput: jest.fn()
  }
  return mockedCore
})
describe('getPullRequestIssuesAction', () => {
  beforeEach(() => {
    mockThrow = false
  })

  it('should use the payload or input pullRequest', async () => {
    await getPullRequestIssuesActionWorker()
    expect(payloadOrInput).toHaveBeenCalledWith('pullRequest')
  })

  it.each([true, false])(
    'should use input and the payload or input pull_request for getting issues',
    async (boolInput: boolean) => {
      mockCaseSensitive = boolInput
      mockUsePullTitle = boolInput
      mockUsePullBody = boolInput
      mockUseBranch = boolInput
      mockUseCommitMessages = boolInput
      await getPullRequestIssuesActionWorker()
      expect(getPullRequestIssues).toHaveBeenCalledWith(
        mockPullRequest,
        ['closeword1', 'closeword2'],
        boolInput,
        ['issueword1', 'issueword2'],
        ['del1', 'del2'],
        boolInput,
        boolInput,
        boolInput,
        boolInput
      )
    }
  )

  it('should return issues from getPullRequestIssues', async () => {
    const issues = await getPullRequestIssuesActionWorker()
    expect(issues).toEqual([1, 2])
  })
})
