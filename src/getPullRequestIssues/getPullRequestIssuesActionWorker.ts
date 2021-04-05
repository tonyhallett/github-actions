import {PullRequest} from '@octokit/webhooks-definitions/schema'
import {
  getBoolInput,
  getCommaDelimitedStringArrayInput,
  payloadOrInput
} from '../helpers/inputHelpers'
import {getPullRequestIssues} from './getPullRequestIssues'

export async function getPullRequestIssuesActionWorker(): Promise<number[]> {
  const payload = payloadOrInput<'pull_request'>('pullRequest')
  const closeWords = getCommaDelimitedStringArrayInput('closeWords')
  const caseSensitive = getBoolInput('caseSensitive')
  const branchIssueWords = getCommaDelimitedStringArrayInput('branchIssueWords')
  const branchDelimiters = getCommaDelimitedStringArrayInput('branchDelimiters')
  const usePullTitle = getBoolInput('usePullTitle')
  const usePullBody = getBoolInput('usePullBody')
  const useBranch = getBoolInput('useBranch')
  const useCommitMessages = getBoolInput('useCommitMessages')
  const pullRequest = payload.pull_request as PullRequest
  return await getPullRequestIssues(
    pullRequest,
    closeWords,
    caseSensitive,
    branchIssueWords,
    branchDelimiters,
    usePullTitle,
    usePullBody,
    useBranch,
    useCommitMessages
  )
}
