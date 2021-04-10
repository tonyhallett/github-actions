import {PullRequest} from '@octokit/webhooks-definitions/schema'
import {useOctokit} from '../helpers/useOctokit'
import * as core from '@actions/core'
import {setInput} from '../helpers/inputHelpers'
import {getPullRequestIssuesActionWorker} from '../getPullRequestIssues/getPullRequestIssuesActionWorker'
import {context} from '@actions/github'
export async function addCommentToPullAndIssues(
  pullRequest: PullRequest,
  commentStr: string
): Promise<void> {
  await useOctokit(async octokit => {
    const addTo = core.getInput('addTo', {required: true}).toLowerCase()
    let issueNumbers: number[] = []
    if (addTo === 'pull' || addTo === 'pullandissues') {
      issueNumbers.push(pullRequest.number)
    }
    if (addTo === 'issues' || addTo === 'pullandissues') {
      setInput('pullRequest', JSON.stringify({pull_request: pullRequest}))
      issueNumbers = issueNumbers.concat(
        await getPullRequestIssuesActionWorker()
      )
    }
    const commentIds: number[] = []
    for (const issueNumber of issueNumbers) {
      const {data: comment} = await octokit.issues.createComment({
        ...context.repo,
        issue_number: issueNumber,
        body: commentStr
      })
      commentIds.push(comment.id)
      core.info(`Created comment id '${comment.id}' on issue '${issueNumber}'.`)
    }
    core.setOutput('commentIds', commentIds)
  })
}
