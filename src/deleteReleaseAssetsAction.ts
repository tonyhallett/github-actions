import * as github from '@actions/github'
import {getNumberInput} from './helpers/inputHelpers'
import {trySetFailedAsync} from './helpers/tryCatchSetFailed'
import {useOctokit} from './helpers/useOctokit'
import {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods'

type ListReleaseAssetsParameters = RestEndpointMethodTypes['repos']['listReleaseAssets']['parameters']
/*
  deletes release assets from yaml input release_id
*/
export async function deleteReleaseAssetsAction(): Promise<void> {
  return trySetFailedAsync(async () => {
    return useOctokit(async octokit => {
      const releaseId = getNumberInput('release_id', {required: true})
      const {owner, repo} = github.context.repo
      const parameters: ListReleaseAssetsParameters = {
        owner,
        repo,
        release_id: releaseId,
        per_page: 100
      }
      const assets = await octokit.paginate(
        octokit.repos.listReleaseAssets,
        parameters
      )

      for (const asset of assets) {
        await octokit.repos.deleteReleaseAsset({
          ...github.context.repo,
          asset_id: asset.id
        })
      }
    })
  })
}
