import {getWorkflowArtifactsComment} from './getWorkflowArtifactsComment'
import {workflowGetPullRequest} from '../workflowGetPullRequest'
import {trySetFailedAsync} from '../../helpers/tryCatchSetFailed'
import {getBoolInput} from '../../helpers/inputHelpers'
import {addCommentToPullAndIssues} from '../../comments/addCommentToPullAndIssues'
export async function workflowArtifactsPullRequestCommentAction(): Promise<void> {
  return trySetFailedAsync(async () => {
    const pullRequest = await workflowGetPullRequest()
    if (pullRequest === undefined) {
      throw new Error('no pull request')
    } else {
      const commentStr = await getWorkflowArtifactsComment()
      if (commentStr) {
        await addCommentToPullAndIssues(pullRequest, commentStr)
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
