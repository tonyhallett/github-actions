import {PullRequest} from '@octokit/webhooks-definitions/schema'
import {useOctokit} from '../helpers/useOctokit'
import {getPullRequestFromCommitMessage} from '../workflow/workflowGetPullRequest'
import {addCommentToPullAndIssues} from './addCommentToPullAndIssues'
import {addCommentToPullAndIssuesFromPushAction} from './addCommentToPullAndIssuesFromPushAction'
jest.mock('@actions/core', () => {
  return {
    getInput: (inputName: string) => {
      if (inputName === 'comment') {
        return 'the comment'
      }
      throw new Error('unexpected input')
    },
    setFailed: jest.fn()
  }
})
jest.mock('@actions/github', () => {
  return {
    context: {
      payload: {
        head_commit: {
          message: 'the commit message'
        }
      }
    }
  }
})
jest.mock('./addCommentToPullAndIssues')
jest.mock('../workflow/workflowGetPullRequest', () => {
  return {
    getPullRequestFromCommitMessage: jest
      .fn()
      .mockResolvedValue({a: 'pullrequest'})
  }
})
const mockOctokit = {mock: 'octokit'}
let mockThrowError = false
const mockError = new Error('errored')

jest.mock('../helpers/useOctokit', () => {
  return {
    useOctokit: jest.fn(callback => {
      if (mockThrowError) {
        throw mockError
      }
      return callback(mockOctokit)
    })
  }
})
describe('addCommentToPullAndIssuesFromPushAction', () => {
  it('should setFailed on error', async () => {
    mockThrowError = true
  })
  describe('no error', () => {
    beforeEach(() => {
      mockThrowError = false
    })
    it('should useOctokit env variable', async () => {
      await addCommentToPullAndIssuesFromPushAction()
      expect(useOctokit).toHaveBeenCalledWith(expect.any(Function))
    })
    describe('adding comment to pull and issues', () => {
      let args: [PullRequest, string]
      beforeEach(async () => {
        await addCommentToPullAndIssuesFromPushAction()
        args = (addCommentToPullAndIssues as jest.Mock).mock.calls[0]
      })
      it('should get the pull request from the commit message', async () => {
        expect(getPullRequestFromCommitMessage).toHaveBeenCalledWith(
          mockOctokit,
          'the commit message'
        )
        expect(args[0]).toEqual({a: 'pullrequest'})
      })

      it('should get the comment from input', async () => {
        expect(args[1]).toEqual('the comment')
      })
    })
  })
})
