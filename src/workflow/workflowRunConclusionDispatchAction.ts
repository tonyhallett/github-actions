import * as core from '@actions/core'
import * as github from '@actions/github'
import {EventPayloadMap} from '@octokit/webhooks-definitions/schema'
import {trySetFailedAsync} from '../helpers/tryCatchSetFailed'
import {useOctokit} from '../helpers/useOctokit'

/*
  For use in a workflow run.  Create a dispatch event to be used in 
  a repository_dispatch workflow.  Event is `${workflowName} - ${conclusion}`
  and client_payload is the workflow run payload.
  Useful for finer control of workflow run execution - instead of completed/requested
*/
export async function workflowRunConclusionDispatchAction(): Promise<void> {
  return trySetFailedAsync(async () => {
    const payload = github.context.payload as EventPayloadMap['workflow_run']
    const conclusion = payload.workflow_run.conclusion
    const workflowName = payload.workflow.name
    await useOctokit(
      async octokit => {
        const eventType = `${workflowName} - ${conclusion}`
        core.debug(`event type - ${eventType}`)
        await octokit.repos.createDispatchEvent({
          event_type: eventType,
          client_payload: payload,
          ...github.context.repo
        })
      },
      'GITHUB_PAT',
      false
    )
  })
}
