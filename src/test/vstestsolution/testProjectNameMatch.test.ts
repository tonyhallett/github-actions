import {setInput} from '../../helpers'
import {testProjectNameMatch} from './testProjectNameMatch'
describe('testProjectNameMatch', () => {
  interface DefaultProjectNameMatchTest {
    projectName: string
    expectedMatch: boolean
  }
  const defaultTests: DefaultProjectNameMatchTest[] = [
    {
      projectName: 'SomeTestProject',
      expectedMatch: true
    },
    {
      projectName: 'test',
      expectedMatch: true
    },
    {
      projectName: 'Other',
      expectedMatch: false
    }
  ]

  defaultTests.forEach(test => {
    it('should default to regex match test ', () => {
      expect(testProjectNameMatch(test.projectName)).toBe(test.expectedMatch)
    })
  })

  interface InputProjectNameMatchTest {
    projectName: string
    input: string
    expectedMatch: boolean
  }
  const inputTests: InputProjectNameMatchTest[] = [
    {
      projectName: 'other',
      input: '/other/i',
      expectedMatch: true
    },
    {
      projectName: 'Other',
      input: '/other/i',
      expectedMatch: true
    },
    {
      projectName: 'not',
      input: '/other/i',
      expectedMatch: false
    }
  ]

  inputTests.forEach(test => {
    it('should use testNameRegex input', () => {
      setInput('testNameRegex', test.input)
      expect(testProjectNameMatch(test.projectName)).toBe(test.expectedMatch)
    })
  })
})
