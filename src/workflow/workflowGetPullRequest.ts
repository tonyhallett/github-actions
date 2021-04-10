import * as github from '@actions/github'
import {
  PullRequest,
  WorkflowRunEvent
} from '@octokit/webhooks-definitions/schema'
import {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods'
import {getStringInput, payloadOrInput} from '../helpers/inputHelpers'
import {useOctokit, Octokit} from '../helpers/useOctokit'

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
  const payload = payloadOrInput<'workflow_run'>('workflowPayload')
  return await useOctokit(async octokit => {
    switch (payload.workflow_run.event) {
      case 'push':
        return getPullRequestFromCommitMessage(
          octokit,
          payload.workflow_run.head_commit.message
        )
      case 'pull_request':
        return getPullRequestForPullRequestWorkflow(octokit, payload)
      default:
        throw new Error('unsupported workflow run event')
    }
  })
}

async function getPullRequestForPullRequestWorkflow(
  octokit: Octokit,
  payload: WorkflowRunEvent
): Promise<PullRequest> {
  const pullState = getPullState()
  const workflowRun = payload.workflow_run
  const headBranch = workflowRun.head_branch
  const headSha = workflowRun.head_sha
  const ownerLogin = workflowRun.head_repository.owner.login
  const parameters: PullsListParameters = {
    per_page: 100,
    head: `${ownerLogin}:${headBranch}`,
    state: pullState,
    ...github.context.repo
  }
  const openHeadPulls: Pulls = await octokit.paginate(
    octokit.pulls.list,
    parameters
  )
  return (openHeadPulls.find(
    pull => pull.head.sha === headSha
  ) as never) as PullRequest
}

export async function getPullRequestFromCommitMessage(
  octokit: Octokit,
  commitMessage: string
): Promise<PullRequest> {
  const response = await octokit.pulls.get({
    ...github.context.repo,
    pull_number: getPullRequestNumberFromCommitMessage(commitMessage)
  })
  return response.data as PullRequest
}

export function getPullRequestNumberFromCommitMessage(
  commitMessage: string
): number {
  const matches = /#([0-9]*)/.exec(commitMessage)
  if (matches) {
    return Number(matches[1])
  }
  throw new Error('commit message does not match')
}

function getPullState(): PullsListParameters['state'] {
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
  return pullState as PullsListParameters['state']
}
