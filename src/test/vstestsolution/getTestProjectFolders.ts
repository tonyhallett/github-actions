import * as path from 'path'
import parser from 'vs-parse'
import {testProjectNameMatch} from './testProjectNameMatch'
export interface TestProjectFolder {
  path: string
  name: string
}

export async function getTestProjectFolders(
  solnFile: string
): Promise<TestProjectFolder[]> {
  const solutionDirectory = path.dirname(solnFile)
  const solutionData = await parser.parseSolution(solnFile)
  const projects = solutionData.projects
  const projectFolders: TestProjectFolder[] = []
  for (const project of projects) {
    if (testProjectNameMatch(project.name)) {
      const projectFilePath = path.join(solutionDirectory, project.relativePath)
      const projectFolder = path.dirname(projectFilePath)
      projectFolders.push({path: projectFolder, name: project.name})
    }
  }
  return projectFolders
}
