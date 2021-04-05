import * as core from '@actions/core'
import {trySetFailedAsync} from '../helpers/tryCatchSetFailed'
import {getPullRequestIssuesActionWorker} from './getPullRequestIssuesActionWorker'

export async function getPullRequestIssuesAction(): Promise<void> {
  return trySetFailedAsync(async () => {
    const issues = await getPullRequestIssuesActionWorker()
    core.setOutput('issues', issues)
  })
}
