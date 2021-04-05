import {getOctokit} from '@actions/github'
import * as core from '@actions/core'
import {useOctokit} from './useOctokit'
const mockOctokit = {mock: 'octokit'}
jest.mock('@actions/github', () => {
  return {
    getOctokit: jest.fn(() => mockOctokit)
  }
})

jest.mock('@actions/core', () => {
  return {
    getInput: jest.fn().mockReturnValue('input value')
  }
})

describe('useOctokit', () => {
  it('should throw error when expected from environment and not present', async () => {
    expect(useOctokit(async () => 1, 'EnvName', true)).rejects.toThrow()
  })
  it('should call the callback ( and return the return value) with authenticated octokit from environment if expected and present', async () => {
    process.env['EnvName'] = 'env value'
    const callback = jest.fn().mockResolvedValue(123)
    expect(await useOctokit(callback, 'EnvName', true)).toEqual(123)
    expect(callback).toHaveBeenCalledWith(mockOctokit)
    expect(getOctokit).toHaveBeenCalledWith('env value')
  })
  it('should be required if expected from input', async () => {
    await useOctokit(async () => 1, 'inputName', false)
    expect(core.getInput).toHaveBeenCalledWith('inputName', {required: true})
  })
  it('should call the callback ( and return the return value) with authenticated octokit from input if expected and present', async () => {
    const callback = jest.fn().mockResolvedValue(123)
    expect(await useOctokit(callback, 'inputName', false)).toEqual(123)
    expect(callback).toHaveBeenCalledWith(mockOctokit)
    expect(getOctokit).toHaveBeenCalledWith('input value')
  })

  it('should default to environment variable GITHUB_TOKEN', async () => {
    process.env['GITHUB_TOKEN'] = 'env github token'
    await useOctokit(jest.fn())
    expect(getOctokit).toHaveBeenCalledWith('env github token')
  })
})
