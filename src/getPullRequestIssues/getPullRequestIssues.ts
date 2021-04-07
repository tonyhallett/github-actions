import * as core from '@actions/core'
import {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods'
import {getIssuesFromHash, getIssuesFromBranch} from './getIssuesFrom'
import {PullRequest} from '@octokit/webhooks-definitions/schema'
import {getUniqueIssues, IIssuesProvider} from './getUniqueIssues'
import {useOctokit} from '../helpers/useOctokit'

type ListCommits = RestEndpointMethodTypes['pulls']['listCommits']
type ListCommitsData = ListCommits['response']['data']

class ConditionalIssuesProvider implements IIssuesProvider {
  constructor(
    readonly name: string,
    readonly canUse: boolean,
    readonly getIssuesImpl: IIssuesProvider['getIssues']
  ) {
    this.cannotProvideMessage = `not looking at ${name}`
  }

  canProvide(): boolean {
    return this.canUse
  }
  cannotProvideMessage: string | undefined
  async getIssues(
    pullRequest: PullRequest,
    closeWords: string[],
    caseSensitive: boolean
  ): Promise<number[]> {
    return this.getIssuesImpl(pullRequest, closeWords, caseSensitive)
  }
}
export const pullTitleProviderName = 'pull title'
export const pullBodyProviderName = 'pull body'
export const branchProviderName = 'branch'
export const commitMessagesProviderName = 'commit messages'
export async function getPullRequestIssues(
  pr: PullRequest,
  closeWords: string[],
  caseSensitive: boolean,
  branchIssueWords: string[],
  branchDelimiters: string[],
  usePullTitle: boolean,
  usePullBody: boolean,
  useBranch: boolean,
  useCommitMessages: boolean
): Promise<number[]> {
  const issueProviders: IIssuesProvider[] = [
    new ConditionalIssuesProvider(
      pullTitleProviderName,
      usePullTitle,
      async (pullRequest, _closeWords, _caseSensitive) =>
        getIssuesFromHash(pullRequest.title, _closeWords, _caseSensitive)
    ),
    new ConditionalIssuesProvider(
      pullBodyProviderName,
      usePullBody,
      async (pullRequest, _closeWords, _caseSensitive) =>
        getIssuesFromHash(pullRequest.body, _closeWords, _caseSensitive)
    ),
    new ConditionalIssuesProvider(
      branchProviderName,
      useBranch,
      async (pullRequest, _closeWords, _caseSensitive) =>
        getIssuesFromBranch(
          pullRequest.head.ref,
          _closeWords,
          branchIssueWords,
          branchDelimiters,
          _caseSensitive
        )
    ),
    new ConditionalIssuesProvider(
      commitMessagesProviderName,
      useCommitMessages,
      async (pullRequest, _closeWords, _caseSensitive) => {
        return useOctokit(async octokit => {
          let issues: number[] = []
          /*
            todo
            Lists a maximum of 250 commits for a pull request. 
            To receive a complete commit list for pull requests with more than 250 commits, 
            use the List commits endpoint. https://docs.github.com/en/rest/reference/repos#list-commits
          */
          if (pullRequest.commits > 250) {
            core.warning(
              `pull has ${pullRequest.commits}. Only 250 commits will be looked at`
            )
          }
          const commitsData: ListCommitsData = await octokit.paginate(
            pullRequest.commits_url,
            {
              per_page: 100
            }
          )
          for (const commitData of commitsData) {
            const issuesFromHash = getIssuesFromHash(
              commitData.commit.message,
              _closeWords,
              _caseSensitive
            )
            issues = issues.concat(issuesFromHash)
          }
          return issues
        })
      }
    )
  ]
  const uniqueIssues = await getUniqueIssues(
    pr,
    closeWords,
    caseSensitive,
    issueProviders
  )
  return uniqueIssues
}
