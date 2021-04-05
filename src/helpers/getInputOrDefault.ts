import * as core from '@actions/core'
export type InputOptionsExtended<TDefault> = core.InputOptions & {
  defaultValue?: TDefault
}

export function getInputOrDefault<T>(
  inputName: string,
  transformer: (input: string) => T,
  options?: InputOptionsExtended<T>
): T {
  let input: string
  if (options?.defaultValue !== undefined) {
    input = core.getInput(inputName)
    if (input === '') {
      return options.defaultValue
    }
  }
  input = core.getInput(inputName, options)
  return transformer(input)
}
