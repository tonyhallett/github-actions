function isStartOfWord(word: string, index: number): boolean {
  if (index === 0) {
    return true
  }
  return word[index - 1].trim() === ''
}

export function getIssuesFromHash(
  search: string,
  closeWords: string[],
  caseSensitive: boolean
): number[] {
  if (!caseSensitive) {
    search = search.toLowerCase()
    closeWords = closeWords.map(cw => cw.toLowerCase())
  }
  const issueNumbers: number[] = []
  for (const closeWord of closeWords) {
    const indices = findAllIndices(search, closeWord).filter(index =>
      isStartOfWord(search, index)
    )
    for (const index of indices) {
      let foundHash = false
      let isOk = true
      let issueChars = ''
      const start = index + closeWord.length
      for (let i = start; i < search.length; i++) {
        const c = search[i]
        if (foundHash === false) {
          if (c.trim() === '') {
            continue
          }
          if (c === '#') {
            foundHash = true
          } else {
            break
          }
        } else {
          if (c.trim() === '') {
            break
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const isNum = !isNaN(c as any)
          if (isNum) {
            issueChars += c
          } else {
            isOk = false
            break
          }
        }
      }

      if (foundHash && isOk && issueChars.length > 0) {
        issueNumbers.push(+issueChars)
      }
    }
  }

  return issueNumbers.sort((a, b) => a - b)
}

function findAllIndices(search: string, word: string): number[] {
  const result: number[] = []
  let dif = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const index = search.indexOf(word)
    if (index === -1) break
    else {
      result.push(index + dif)
      const cur = search.length
      search = search.substring(index + word.length)
      dif += cur - search.length
    }
  }
  return result
}

export function getIssuesFromBranch(
  branch: string,
  closeWords: string[],
  issueWords: string[],
  delimiters: string[],
  caseSensitive: boolean
): number[] {
  if (!caseSensitive) {
    branch = branch.toLowerCase()
    closeWords = closeWords.map(cw => cw.toLowerCase())
    issueWords = issueWords.map(cw => cw.toLowerCase())
  }
  let foundDelimiter: string | undefined
  let branchWithoutCloseWord: string | undefined
  for (const closeWord of closeWords) {
    for (const delimiter of delimiters) {
      const closeWordAndDelimiter = `${closeWord}${delimiter}`
      if (branch.startsWith(closeWordAndDelimiter)) {
        branchWithoutCloseWord = branch.substr(closeWordAndDelimiter.length)
        foundDelimiter = delimiter
        break
      }
    }
    if (branchWithoutCloseWord !== undefined) {
      break
    }
  }
  if (
    branchWithoutCloseWord !== undefined &&
    branchWithoutCloseWord.length > 0
  ) {
    let found = false
    if (issueWords.length > 0) {
      for (const issueWord of issueWords) {
        if (
          branchWithoutCloseWord.startsWith(`${issueWord}${foundDelimiter}`)
        ) {
          branchWithoutCloseWord = branchWithoutCloseWord.substr(
            issueWord.length
          )
          found = true
          break
        }
      }
    } else {
      found = true
    }
    if (found) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const parts = branchWithoutCloseWord.split(foundDelimiter!)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return parts.filter(p => p.length > 0 && !isNaN(p as any)).map(p => +p)
    }
  }

  return []
}
