import * as github from '@actions/github'
import {PullRequest} from '@octokit/webhooks-definitions/schema'
import {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods'
import {getStringInput, payloadOrInput} from '../helpers/inputHelpers'
import {useOctokit} from '../helpers/useOctokit'
type PullsList = RestEndpointMethodTypes['pulls']['list']
type PullsListParameters = PullsList['parameters']
type Pulls = PullsList['response']['data']

export const pullStateInputName = 'pullState'
/*
  get the pull request from workflow run payload ( for workflow run initiated from pull request)
  or from input ( for when using workflow_run_conclusion_dispatch)
*/
export async function workflowGetPullRequest(): Promise<
  PullRequest | undefined
> {
  let payload = payloadOrInput<'workflow_run'>('workflowPayload')
  const pullState = getStringInput(pullStateInputName, {
    defaultValue: 'all'
  })
  const acceptableStates: PullsListParameters['state'][] = [
    'all',
    'closed',
    'open'
  ]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!acceptableStates.includes(pullState as any)) {
    throw new Error(`Incorrect pullState input - allowed all | closed | open`)
  }
  const workflowRun = payload.workflow_run
  const headBranch = workflowRun.head_branch
  const headSha = workflowRun.head_sha
  const ownerLogin = workflowRun.head_repository.owner.login
  return await useOctokit(async octokit => {
    const parameters: PullsListParameters = {
      per_page: 100,
      head: `${ownerLogin}:${headBranch}`,
      state: pullState as PullsListParameters['state'],
      ...github.context.repo
    }
    const openHeadPulls: Pulls = await octokit.paginate(
      octokit.pulls.list,
      parameters
    )
    return (openHeadPulls.find(
      pull => pull.head.sha === headSha
    ) as never) as PullRequest
  })
}
