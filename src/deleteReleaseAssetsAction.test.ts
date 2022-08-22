import {setFailed} from '@actions/core'
import {deleteReleaseAssetsAction} from './deleteReleaseAssetsAction'
import {useOctokit} from './helpers/useOctokit'
import {getNumberInput} from './helpers/inputHelpers'

const mockReleaseAssets: {id: number}[] = [
  {
    id: 1
  },
  {
    id: 2
  }
]
const mockOctokit = {
  paginate: jest.fn(() => mockReleaseAssets),
  repos: {
    listReleaseAssets: {
      endpoint: '....'
    },
    deleteReleaseAsset: jest.fn()
  }
}
let mockThrow = false
const mockError = new Error('errored')
jest.mock('@actions/core')
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
jest.mock('./helpers/inputHelpers', () => {
  return {
    getNumberInput: jest.fn((inputName: string) => {
      if (inputName === 'release_id') {
        return 123
      }
    })
  }
})
jest.mock('./helpers/useOctokit', () => ({
  useOctokit: jest.fn(callback => {
    if (mockThrow) {
      throw mockError
    }
    return callback(mockOctokit)
  })
}))
describe('deleteReleaseAssetsAction', () => {
  beforeEach(() => {
    mockThrow = false
  })
  it('should setFailed if error', async () => {
    mockThrow = true
    await deleteReleaseAssetsAction()
    expect(setFailed).toHaveBeenCalledWith(mockError)
  })

  it('should useOctokit with GITHUB_TOKEN environment variable', async () => {
    await deleteReleaseAssetsAction()
    expect(useOctokit).toHaveBeenCalledWith(expect.any(Function))
  })

  it('should get all release assets of release_id required input 100 paginated', async () => {
    await deleteReleaseAssetsAction()

    expect(getNumberInput).toHaveBeenCalledWith('release_id', {required: true})
    expect(mockOctokit.paginate).toHaveBeenCalledWith(
      mockOctokit.repos.listReleaseAssets,
      {
        owner: 'theowner',
        repo: 'therepo',
        release_id: 123,
        per_page: 100
      }
    )
  })
  it('should delete all assets from release_id input', async () => {
    await deleteReleaseAssetsAction()
    const expectedAssetDeletions = [1, 2]
    for (const expectedAssetDeletion of expectedAssetDeletions) {
      expect(mockOctokit.repos.deleteReleaseAsset).toHaveBeenCalledWith({
        owner: 'theowner',
        repo: 'therepo',
        asset_id: expectedAssetDeletion
      })
    }
  })
})
