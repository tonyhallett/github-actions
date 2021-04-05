import {useOctokit} from '../../helpers/useOctokit'
import {getWorkflowArtifactDetails} from './getWorkflowArtifactDetails'

const mockOctokit = {
  paginate: jest.fn().mockResolvedValue([
    {
      id: 1,
      name: 'artifact1'
    },
    {
      id: 2,
      name: 'artifact2'
    }
  ])
}
jest.mock('../../helpers/useOctokit', () => {
  return {
    useOctokit: jest.fn(callback => callback(mockOctokit))
  }
})

jest.mock('../../helpers/inputHelpers', () => {
  return {
    payloadOrInput: jest.fn((inputName: string) => {
      if (inputName !== 'workflowPayload') {
        throw new Error('unexpected input')
      }
      return {
        repository: {
          html_url: 'repourl'
        },
        workflow_run: {
          check_suite_id: 123,
          artifacts_url: 'artifactsurl'
        }
      }
    })
  }
})
describe('getWorkflowArtifactDetails', () => {
  it('should useOctokit from environment', async () => {
    await getWorkflowArtifactDetails()
    expect(useOctokit).toHaveBeenCalledWith(expect.any(Function))
  })

  it('should paginate 100 workflow run artifacts url from payload or input', async () => {
    await getWorkflowArtifactDetails()
    expect(mockOctokit.paginate).toHaveBeenCalledWith('artifactsurl', {
      per_page: 100
    })
  })

  it('should map artifacts keeping id, name and constructing the httpUrl', async () => {
    const artifactDetails = await getWorkflowArtifactDetails()
    expect(artifactDetails).toEqual([
      {
        id: 1,
        name: 'artifact1',
        httpUrl: 'repourl/suites/123/artifacts/1'
      },
      {
        id: 2,
        name: 'artifact2',
        httpUrl: 'repourl/suites/123/artifacts/2'
      }
    ])
  })
})
