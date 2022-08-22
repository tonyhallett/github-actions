import {getUniqueIssues, IIssuesProvider} from './getUniqueIssues'
describe('getUniqueIssues', () => {
  it.each([true, false])(
    'should have unique issues from the issue providers that can provide - case sensitive %s',
    async (caseSensitive: boolean) => {
      const alwaysProvide: IIssuesProvider = {
        canProvide: () => true,
        getIssues: jest.fn().mockResolvedValue([1, 2]),
        cannotProvideMessage: '',
        name: ''
      }
      const dependentProvider: IIssuesProvider = {
        canProvide: () => caseSensitive,
        getIssues: jest.fn().mockResolvedValue([1, 3]),
        cannotProvideMessage: '',
        name: ''
      }
      const providers = [alwaysProvide, dependentProvider]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pullRequest = {the: 'pull request'} as any
      const issues = await getUniqueIssues(
        pullRequest,
        ['closeword'],
        caseSensitive,
        providers
      )
      const expectedIssues = caseSensitive ? [1, 2, 3] : [1, 2]
      expect(issues).toEqual(expectedIssues)
      for (const provider of providers) {
        if (provider.canProvide()) {
          expect(provider.getIssues).toHaveBeenCalledWith(
            pullRequest,
            ['closeword'],
            caseSensitive
          )
        }
      }
    }
  )
})
