import * as core from '@actions/core'
import {context} from '@actions/github'
import {getWorkflowArtifactsComment} from './getWorkflowArtifactsComment'
import {useOctokit} from '../../helpers/useOctokit'
import {
  pullStateInputName,
  workflowGetPullRequest
} from '../workflowGetPullRequest'
import {trySetFailedAsync} from '../../helpers/tryCatchSetFailed'
import {getBoolInput, setInput} from '../../helpers/inputHelpers'
import {getPullRequestIssuesActionWorker} from '../../getPullRequestIssues/getPullRequestIssuesActionWorker'
export async function workflowArtifactsPullRequestCommentAction(): Promise<void> {
  return trySetFailedAsync(async () => {
    setInput(pullStateInputName, 'open')
    const pullRequest = await workflowGetPullRequest()
    if (pullRequest === undefined) {
      throw new Error('no pull request')
    } else {
      const commentStr = await getWorkflowArtifactsComment()
      if (commentStr) {
        await useOctokit(async octokit => {
          const addTo = core.getInput('addTo', {required: true}).toLowerCase()
          let issueNumbers: number[] = []
          if (addTo === 'pull' || addTo === 'pullandissues') {
            issueNumbers.push(pullRequest.number)
          }
          if (addTo === 'issues' || addTo === 'pullandissues') {
            setInput('pullRequest', JSON.stringify(pullRequest))
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
            core.info(
              `Created comment id '${comment.id}' on issue '${issueNumber}'.`
            )
          }
          core.setOutput('commentIds', commentIds)
        })
      } else {
        const errorNoArtifacts = getBoolInput('errorNoArtifacts', {
          defaultValue: true
        })
        if (errorNoArtifacts) {
          throw new Error('no artifacts')
        }
      }
    }
  })
}
