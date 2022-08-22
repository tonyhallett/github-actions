import {getIssuesFromBranch, getIssuesFromHash} from './getIssuesFrom'

const delimiters = ['_', '-']

const closeWords = [
  'close',
  'closes',
  'closed',
  'fix',
  'fixes',
  'fixed',
  'resolve',
  'resolves',
  'resolved'
]

const issueWords = ['issue', 'issues']

describe('getIssueFromHash', () => {
  it.each(closeWords)(
    `should find singular case sensitive %s`,
    (cw: string) => {
      const issueNumbers = getIssuesFromHash(`${cw} #1`, closeWords, true)
      expect(issueNumbers).toEqual([1])
    }
  )

  it('should not match when case is different when case sensitive', () => {
    const issueNumbers = getIssuesFromHash(`Fix #1`, ['fix'], true)
    expect(issueNumbers).toEqual([])
  })

  it('should match when case is different when case insensitive', () => {
    const issueNumbers = getIssuesFromHash(`Fix #1`, ['fix'], false)
    expect(issueNumbers).toEqual([1])
  })

  it('should accept whitespace after close word', () => {
    const issueNumbers = getIssuesFromHash(`fix    #1`, closeWords, true)
    expect(issueNumbers).toEqual([1])
  })

  it('should not match without #', () => {
    const issueNumbers = getIssuesFromHash(`fix 1`, closeWords, true)
    expect(issueNumbers).toEqual([])
  })

  it('should not match #?1', () => {
    const issueNumbers = getIssuesFromHash(`fix #?1`, closeWords, true)
    expect(issueNumbers).toEqual([])
  })

  it('should find multiple', () => {
    const issueNumbers = getIssuesFromHash(`fix #1 close #2`, closeWords, true)
    expect(issueNumbers).toEqual([1, 2])
  })

  it('should not match words containing close words', () => {
    const issueNumbers = getIssuesFromHash(`suffix #1`, closeWords, true)
    expect(issueNumbers).toEqual([])
  })

  it('should not concat numbers', () => {
    const issueNumbers = getIssuesFromHash(`fix #1 1 .etc`, closeWords, true)
    expect(issueNumbers).toEqual([1])
  })
})

describe('getIssuesFromBranch', () => {
  for (const issueNumber of [1, 10, 100]) {
    for (const dl of delimiters) {
      for (const cw of closeWords) {
        for (const iw of issueWords) {
          const branchName = `${cw}${dl}${iw}${dl}${issueNumber}`
          it(`finds singular ${branchName}`, () => {
            const issues = getIssuesFromBranch(
              branchName,
              closeWords,
              issueWords,
              delimiters,
              true
            )
            expect(issues.length).toBe(1)
            expect(issues[0]).toBe(issueNumber)
          })
        }
      }
    }
  }

  for (const dl of delimiters) {
    for (const cw of closeWords) {
      for (const iw of issueWords) {
        const branchName = `${cw}${dl}${iw}${dl}10${dl}20`
        it(`finds singular ${branchName}`, () => {
          const issues = getIssuesFromBranch(
            branchName,
            closeWords,
            issueWords,
            delimiters,
            true
          )
          expect(issues.length).toBe(2)
          expect(issues[0]).toBe(10)
          expect(issues[1]).toBe(20)
        })
      }
    }
  }

  it('should return empty if does not match - delimiter', () => {
    const issues = getIssuesFromBranch(
      'fix-issue-10',
      closeWords,
      issueWords,
      ['#'],
      true
    )
    expect(issues.length).toBe(0)
  })

  it('should return empty if does not match - close word', () => {
    const issues = getIssuesFromBranch(
      'goodbye-issue-10',
      closeWords,
      issueWords,
      delimiters,
      true
    )
    expect(issues.length).toBe(0)
  })

  it('should return empty if case different and sensitive - close word', () => {
    const issues = getIssuesFromBranch(
      'Close-issue-10',
      closeWords,
      issueWords,
      delimiters,
      true
    )
    expect(issues.length).toBe(0)
  })

  it('should match if case different and insensitive - close word', () => {
    const issues = getIssuesFromBranch(
      'Close-issue-10',
      closeWords,
      issueWords,
      delimiters,
      false
    )
    expect(issues).toEqual([10])
  })

  it('should return empty if does not match - issue word', () => {
    const issues = getIssuesFromBranch(
      'fix-error-10',
      closeWords,
      issueWords,
      delimiters,
      true
    )
    expect(issues.length).toBe(0)
  })

  it('should return empty if case different and sensitive - issue word', () => {
    const issues = getIssuesFromBranch(
      'fix-error-10',
      closeWords,
      ['Error'],
      delimiters,
      true
    )
    expect(issues.length).toBe(0)
  })

  it('should match if case different and insensitive - issue word', () => {
    const issues = getIssuesFromBranch(
      'fix-error-10',
      closeWords,
      ['Error'],
      delimiters,
      false
    )
    expect(issues).toEqual([10])
  })

  it('should work without issue words', () => {
    const issues = getIssuesFromBranch(
      'fix-10',
      closeWords,
      [],
      delimiters,
      true
    )
    expect(issues.length).toBe(1)
    expect(issues[0]).toBe(10)
  })
})
