import * as core from '@actions/core'
import {getOctokit} from '@actions/github'
export type Octokit = ReturnType<typeof getOctokit>
export async function useOctokit<TResult>(
  usage: (octokit: Octokit) => Promise<TResult>,
  inputOrEnvironmentName = 'GITHUB_TOKEN',
  fromEnvironment = true,
  requiredFor?: string
): Promise<TResult> {
  let githubToken: string | undefined
  if (fromEnvironment) {
    githubToken = process.env[inputOrEnvironmentName]
    if (githubToken === undefined) {
      requiredFor =
        requiredFor === undefined ? 'required' : `required for ${requiredFor}`
      throw new Error(`{token} 'environment variable' ${requiredFor}`)
    }
  } else {
    githubToken = core.getInput(inputOrEnvironmentName, {required: true})
  }

  return usage(getOctokit(githubToken))
}
