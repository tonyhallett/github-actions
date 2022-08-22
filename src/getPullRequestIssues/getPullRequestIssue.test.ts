/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  branchProviderName,
  commitMessagesProviderName,
  getPullRequestIssues,
  pullBodyProviderName,
  pullTitleProviderName
} from './getPullRequestIssues'
import {getIssuesFromBranch, getIssuesFromHash} from './getIssuesFrom'
import {getUniqueIssues, IIssuesProvider} from './getUniqueIssues'
import {useOctokit} from '../helpers/useOctokit'
jest.mock('./getUniqueIssues', () => {
  return {
    getUniqueIssues: jest.fn().mockReturnValue(Promise.resolve([1, 2]))
  }
})
jest.mock('./getIssuesFrom', () => {
  return {
    getIssuesFromBranch: jest.fn().mockReturnValue([1, 2]),
    getIssuesFromHash: jest.fn().mockReturnValue([3, 4])
  }
})
const mockOctokit = {
  paginate: jest.fn().mockReturnValue([
    {
      commit: {
        message: 'commit 1'
      }
    },
    {
      commit: {
        message: 'commit 2'
      }
    }
  ])
}
jest.mock('../helpers/useOctokit', () => {
  return {
    useOctokit: jest.fn(callback => callback(mockOctokit))
  }
})
const booleanValues = [true, false]
describe('getPullRequestIssues', () => {
  it('should get unique issues based upon the pull request', async () => {
    const pullRequest = {the: 'pullrequest'}
    await getPullRequestIssues(
      pullRequest as any,
      [],
      false,
      [],
      [],
      false,
      false,
      false,
      false
    )
    expect(getUniqueIssues).toHaveBeenCalledWith(
      pullRequest,
      expect.anything(),
      expect.anything(),
      expect.anything()
    )
  })
  it('should get unique issues based on close words', async () => {
    const closeWords = ['closeword1', 'closeword2']
    await getPullRequestIssues(
      {} as any,
      closeWords,
      false,
      [],
      [],
      false,
      false,
      false,
      false
    )
    expect(getUniqueIssues).toHaveBeenCalledWith(
      expect.anything(),
      closeWords,
      expect.anything(),
      expect.anything()
    )
  })
  it.each([true, false])(
    'should get unique issues based on caseSensitive - %s',
    async (caseSensitive: boolean) => {
      await getPullRequestIssues(
        {} as any,
        [],
        caseSensitive,
        [],
        [],
        false,
        false,
        false,
        false
      )
      expect(getUniqueIssues).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        caseSensitive,
        expect.anything()
      )
    }
  )

  it('should return the unique issues', async () => {
    const issues = await getPullRequestIssues(
      {} as any,
      [],
      false,
      [],
      [],
      false,
      false,
      false,
      false
    )
    expect(issues).toEqual([1, 2])
  })

  async function canProvideTest(
    usePullTitle: boolean,
    usePullBody: boolean,
    useBranch: boolean,
    useCommitMessages: boolean,
    providerName: string,
    expected: boolean
  ): Promise<void> {
    await getPullRequestIssues(
      {} as any,
      [],
      false,
      [],
      [],
      usePullTitle,
      usePullBody,
      useBranch,
      useCommitMessages
    )
    const issueProviders: IIssuesProvider[] = (getUniqueIssues as jest.Mock)
      .mock.calls[0][3]
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pullTitleProvider = issueProviders.find(
      ip => ip.name === providerName
    )!
    expect(pullTitleProvider.canProvide()).toEqual(expected)
  }

  const branchIssueWords = ['branchissueword']
  const branchDelimiters = ['del1']
  async function getPullRequestIssueProvider(
    providerName: string
  ): Promise<IIssuesProvider> {
    await getPullRequestIssues(
      {} as any,
      [],
      false,
      branchIssueWords,
      branchDelimiters,
      true,
      true,
      true,
      true
    )
    const issueProviders: IIssuesProvider[] = (getUniqueIssues as jest.Mock)
      .mock.calls[0][3]
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return issueProviders.find(ip => ip.name === providerName)!
  }

  it.each(booleanValues)(
    'should use pullTitle dependent upon usePullTitle - %s',
    async (usePullTitle: boolean) => {
      return canProvideTest(
        usePullTitle,
        false,
        false,
        false,
        pullTitleProviderName,
        usePullTitle
      )
    }
  )

  it.each(booleanValues)(
    'should use pullBody dependent upon usePullBody - %s',
    async (usePullBody: boolean) => {
      return canProvideTest(
        false,
        usePullBody,
        false,
        false,
        pullBodyProviderName,
        usePullBody
      )
    }
  )

  it.each(booleanValues)(
    'should useBranch dependent upon useBranch - %s',
    async (useBranch: boolean) => {
      return canProvideTest(
        false,
        false,
        useBranch,
        false,
        branchProviderName,
        useBranch
      )
    }
  )

  it.each(booleanValues)(
    'should use commit message dependent upon useCommitMessages - %s',
    async (useCommitMessages: boolean) => {
      return canProvideTest(
        false,
        false,
        false,
        useCommitMessages,
        commitMessagesProviderName,
        useCommitMessages
      )
    }
  )

  it.each(booleanValues)(
    'should getIssuesFromHash for pull title',
    async (caseSensitive: boolean) => {
      const pullTitleProvider = await getPullRequestIssueProvider(
        pullTitleProviderName
      )
      const issues = await pullTitleProvider.getIssues(
        {title: 'the title'} as any,
        ['thecloseword'],
        caseSensitive
      )
      expect(issues).toEqual([3, 4])
      expect(getIssuesFromHash).toHaveBeenCalledWith(
        'the title',
        ['thecloseword'],
        caseSensitive
      )
    }
  )

  it.each(booleanValues)(
    'should getIssuesFromHash for pull body',
    async (caseSensitive: boolean) => {
      const pullBodyProvider = await getPullRequestIssueProvider(
        pullBodyProviderName
      )
      const issues = await pullBodyProvider.getIssues(
        {body: 'the body'} as any,
        ['thecloseword'],
        caseSensitive
      )
      expect(issues).toEqual([3, 4])
      expect(getIssuesFromHash).toHaveBeenCalledWith(
        'the body',
        ['thecloseword'],
        caseSensitive
      )
    }
  )

  it.each(booleanValues)(
    'should getIssuesFromBranch for branch',
    async (caseSensitive: boolean) => {
      const branchProvider = await getPullRequestIssueProvider(
        branchProviderName
      )
      const issues = await branchProvider.getIssues(
        {head: {ref: 'the branch'}} as any,
        ['thecloseword'],
        caseSensitive
      )
      expect(issues).toEqual([1, 2])
      expect(getIssuesFromBranch).toHaveBeenCalledWith(
        'the branch',
        ['thecloseword'],
        branchIssueWords,
        branchDelimiters,
        caseSensitive
      )
    }
  )

  describe.each(booleanValues)('commit messages', (caseSensitive: boolean) => {
    let issues: number[]
    beforeEach(async () => {
      const commitMessagesProvider = await getPullRequestIssueProvider(
        commitMessagesProviderName
      )
      issues = await commitMessagesProvider.getIssues(
        {commits: 2, commits_url: 'commits url'} as any,
        ['thecloseword'],
        caseSensitive
      )
    })
    it('should useOctokit', async () => {
      expect(useOctokit).toHaveBeenCalledWith(expect.any(Function))
    })
    it('should paginate the commits url with 100 per page', async () => {
      expect(mockOctokit.paginate).toHaveBeenCalledWith('commits url', {
        per_page: 100
      })
    })
    it('should getIssuesFromHash for each commit message', async () => {
      expect(getIssuesFromHash).toHaveBeenCalledWith(
        'commit 1',
        ['thecloseword'],
        caseSensitive
      )
      expect(getIssuesFromHash).toHaveBeenCalledWith(
        'commit 2',
        ['thecloseword'],
        caseSensitive
      )
      expect(issues).toEqual([3, 4, 3, 4])
    })
  })
})
