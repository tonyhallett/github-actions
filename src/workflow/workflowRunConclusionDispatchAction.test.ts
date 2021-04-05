import {setFailed} from '@actions/core'
import {useOctokit} from '../helpers/useOctokit'
import {workflowRunConclusionDispatchAction} from './workflowRunConclusionDispatchAction'
import {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods'

jest.mock('@actions/core')
jest.mock('@actions/github', () => {
  return {
    context: {
      payload: {
        workflow_run: {
          conclusion: 'theconclusion'
        },
        workflow: {
          name: 'originalworkflowname'
        }
      },
      repo: {
        owner: 'theowner',
        repo: 'therepo'
      }
    }
  }
})
const mockOctokit = {
  repos: {
    createDispatchEvent: jest.fn()
  }
}
let mockThrow = false
const mockError = new Error('errored')
jest.mock('../helpers/useOctokit', () => {
  return {
    useOctokit: jest.fn(callback => {
      if (mockThrow) {
        throw mockError
      }
      return callback(mockOctokit)
    })
  }
})
describe('workflowRunConclusionDispatchAction', () => {
  beforeEach(() => {
    mockThrow = false
  })
  it('should setFailed on error', async () => {
    mockThrow = true
    await workflowRunConclusionDispatchAction()
    expect(setFailed).toHaveBeenCalledWith(mockError)
  })

  it('should use octokit with input GITHUB_PAT', async () => {
    await workflowRunConclusionDispatchAction()
    expect(useOctokit).toHaveBeenCalledWith(
      expect.any(Function),
      'GITHUB_PAT',
      false
    )
  })

  describe('should dispatch repository dispatch event', () => {
    let dispatchEventParameter: RestEndpointMethodTypes['repos']['createDispatchEvent']['parameters']
    beforeEach(async () => {
      await workflowRunConclusionDispatchAction()
      dispatchEventParameter =
        mockOctokit.repos.createDispatchEvent.mock.calls[0][0]
      expect(dispatchEventParameter.repo).toBe('therepo')
      expect(dispatchEventParameter.owner).toBe('theowner')
    })

    it('should have the event type as workflow name and workflow conclusion', () => {
      expect(dispatchEventParameter.event_type).toBe(
        'originalworkflowname - theconclusion'
      )
    })

    it('should have the original payload as the client_payload', () => {
      expect(dispatchEventParameter.client_payload).toEqual({
        workflow_run: {
          conclusion: 'theconclusion'
        },
        workflow: {
          name: 'originalworkflowname'
        }
      })
    })
  })
})
