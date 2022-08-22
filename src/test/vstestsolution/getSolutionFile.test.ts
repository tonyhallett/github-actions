import {getSolutionFile} from './getSolutionFile'
import * as fs from 'fs'
let mockSolutionInput = ''
let mockSolnExists = false
jest.mock('@actions/core', () => {
  return {
    getInput: jest.fn(() => {
      return mockSolutionInput
    })
  }
})
jest.mock('fs', () => {
  return {
    readdirSync: jest
      .fn()
      .mockReturnValue(['notSoln.txt', 'first.sln', 'second.sln']),
    existsSync: jest.fn(() => {
      return mockSolnExists
    })
  }
})
jest.mock('path', () => {
  return {
    join(first: string, second: string) {
      return `${first}/${second}`
    }
  }
})
describe('getSolutionFile', () => {
  beforeEach(() => {
    process.env.GITHUB_WORKSPACE = 'WORKSPACE'
  })
  describe('input', () => {
    it.each(['asoln.sln', 'asoln'])(
      'should make relative to the workspace directory if does not exist - %s',
      (soln: string) => {
        mockSolutionInput = soln
        const solnFile = getSolutionFile()
        expect(solnFile).toBe('WORKSPACE/asoln.sln')
      }
    )

    it('should return the soln file if it exists', () => {
      mockSolutionInput = 'a.sln'
      mockSolnExists = true
      const solnFile = getSolutionFile()
      expect(solnFile).toBe('a.sln')
    })
  })

  describe('no input', () => {
    it('should return the first soln file in the workspace directory', () => {
      mockSolutionInput = ''
      const solnFile = getSolutionFile()
      expect(fs.readdirSync).toHaveBeenCalledWith('WORKSPACE')
      expect(solnFile).toBe('WORKSPACE/first.sln')
    })
  })
})
