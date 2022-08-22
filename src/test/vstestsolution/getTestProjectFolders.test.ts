import parser from 'vs-parse'
import {getTestProjectFolders} from './getTestProjectFolders'
import {testProjectNameMatch} from './testProjectNameMatch'
import * as path from 'path'

jest.mock('vs-parse', () => {
  return {
    parseSolution: jest.fn().mockResolvedValue({
      projects: [
        {
          name: 'project1',
          relativePath: 'project1/project1.csproj'
        },
        {
          name: 'project2',
          relativePath: 'project2/project2.csproj'
        }
      ]
    })
  }
})

jest.mock('./testProjectNameMatch', () => {
  return {
    testProjectNameMatch: jest.fn((projectName: string) => {
      return projectName === 'project2'
    })
  }
})
describe('getProjectFolders', () => {
  it('should parse the solution file to get the projects', async () => {
    await getTestProjectFolders('a.sln')
    expect(parser.parseSolution).toHaveBeenCalledWith('a.sln')
  })
  it('should include the projects that match the name', async () => {
    const testProjectFolders = await getTestProjectFolders('a.sln')
    expect(testProjectNameMatch).toHaveBeenCalledWith('project1')
    expect(testProjectNameMatch).toHaveBeenCalledWith('project2')
    expect(testProjectFolders.length).toBe(1)
  })

  it('should have the project name', async () => {
    const testProjectFolders = await getTestProjectFolders('a.sln')
    expect(testProjectFolders[0].name).toBe('project2')
  })
  it('should have the path relative to the solution directory', async () => {
    const solnFile = 'C:\\Users\\tonyh\\Source\\Repos\\ASoln\\ASoln.sln'
    const testProjectFolders = await getTestProjectFolders(solnFile)
    expect(testProjectFolders[0].path).toBe(
      path.normalize('C:\\Users\\tonyh\\Source\\Repos\\ASoln\\project2')
    )
  })
})
