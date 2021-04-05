import {PullRequest} from '@octokit/webhooks-definitions/schema'
import {debugIf} from '../helpers/core'

export interface IIssuesProvider {
  name: string
  canProvide: () => boolean
  cannotProvideMessage: string | undefined
  getIssues: (
    pullRequest: PullRequest,
    closeWords: string[],
    caseSensitive: boolean
  ) => Promise<number[]>
}

export async function getUniqueIssues(
  pullRequest: PullRequest,
  closeWords: string[],
  caseSensitive: boolean,
  issueProviders: IIssuesProvider[],
  debug = false
): Promise<number[]> {
  let allIssues: number[] = []
  for (const issueProvider of issueProviders) {
    const canProvide = issueProvider.canProvide()
    if (canProvide) {
      const issues = await issueProvider.getIssues(
        pullRequest,
        closeWords,
        caseSensitive
      )
      allIssues = allIssues.concat(issues)
      if (issues.length === 0) {
        debugIf(debug, `${issueProvider.name} 0 issues`)
      } else {
        const issueOrIssues = issues.length === 1 ? 'issues' : 'issues'
        debugIf(
          debug,
          `${issueProvider.name} ${issueOrIssues} ${issues.join(',')}`
        )
      }
    } else if (issueProvider.cannotProvideMessage) {
      debugIf(debug, issueProvider.cannotProvideMessage)
    }
  }

  return [...new Set(allIssues)].sort((a, b) => a - b)
}
