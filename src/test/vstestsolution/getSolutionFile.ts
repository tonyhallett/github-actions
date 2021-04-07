import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'

export function getSolutionFile(): string {
  const workspace = process.env.GITHUB_WORKSPACE as string
  let solution = core.getInput('solution')
  if (solution !== '') {
    if (!solution.endsWith('.sln')) {
      solution = `${solution}.sln`
    }
    if (!fs.existsSync(solution)) {
      solution = path.join(workspace, solution)
    }
  } else {
    const directoryContents = fs.readdirSync(workspace)
    for (const entry of directoryContents) {
      if (entry.endsWith('.sln')) {
        solution = path.join(workspace, entry)
        break
      }
    }
  }
  return solution
}
