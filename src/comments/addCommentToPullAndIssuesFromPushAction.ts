import {getPullRequestFromCommitMessage, trySetFailedAsync} from '..'
import {useOctokit} from '../helpers'
import * as github from '@actions/github'
import * as core from '@actions/core'
import {EventPayloadMap} from '@octokit/webhooks-definitions/schema'
import {addCommentToPullAndIssues} from './addCommentToPullAndIssues'

export async function addCommentToPullAndIssuesFromPushAction(): Promise<void> {
  return trySetFailedAsync(async () => {
    await useOctokit(async octokit => {
      const pushPayload = (github.context
        .payload as unknown) as EventPayloadMap['push']
      const commitMessage = pushPayload.head_commit?.message
      if (commitMessage) {
        const pullRequest = await getPullRequestFromCommitMessage(
          octokit,
          commitMessage
        )
        addCommentToPullAndIssues(pullRequest, core.getInput('comment'))
      } else {
        throw new Error('no commit message')
      }
    })
  })
}
