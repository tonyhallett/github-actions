import {getUniqueIssues, IIssuesProvider} from './getUniqueIssues'
describe('getUniqueIssues', () => {
  const booleanValues = [true, false]
  booleanValues.forEach(booleanValue => {
    it('should have unique issues from the issue providers that can provide', async () => {
      const alwaysProvide: IIssuesProvider = {
        canProvide: () => true,
        getIssues: jest.fn().mockResolvedValue([1, 2]),
        cannotProvideMessage: '',
        name: ''
      }
      const dependentProvider: IIssuesProvider = {
        canProvide: () => booleanValue,
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
        booleanValue,
        providers
      )
      const expectedIssues = booleanValue ? [1, 2, 3] : [1, 2]
      expect(issues).toEqual(expectedIssues)
      providers.forEach(provider => {
        if (provider.canProvide()) {
          expect(provider.getIssues).toHaveBeenCalledWith(
            pullRequest,
            ['closeword'],
            booleanValue
          )
        }
      })
    })
  })
})
