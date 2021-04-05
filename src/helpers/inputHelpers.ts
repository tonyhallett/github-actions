import * as core from '@actions/core'
import * as github from '@actions/github'
import {EventPayloadMap} from '@octokit/webhooks-definitions/schema'
import {getInputOrDefault, InputOptionsExtended} from './getInputOrDefault'
export function getCommaDelimitedStringArrayInput(
  inputName: string,
  options?: core.InputOptions
): string[] {
  return getInputOrDefault(
    inputName,
    input => (input === '' ? [] : input.split(',').map(i => i.trim())),
    options
  )
}

export function getStringInput(
  inputName: string,
  options?: InputOptionsExtended<string>
): string {
  return getInputOrDefault(inputName, input => input, options)
}

/* false if no default provided */
export function getBoolInput(
  inputName: string,
  options?: InputOptionsExtended<boolean>
): boolean {
  return getInputOrDefault(
    inputName,
    input => input.toLocaleLowerCase() === 'true',
    options
  )
}
/* defaults to 0 */
export function getNumberInput(
  inputName: string,
  options?: InputOptionsExtended<number>
): number {
  return getInputOrDefault(inputName, input => Number(input), options)
}

export function payloadOrInput<TKey extends keyof EventPayloadMap>(
  inputName: string
): EventPayloadMap[TKey] {
  let payload: EventPayloadMap[TKey]
  const inputPayload = core.getInput(inputName)
  if (inputPayload !== '') {
    payload = JSON.parse(inputPayload)
  } else {
    payload = (github.context.payload as unknown) as EventPayloadMap[TKey]
  }
  return payload
}

export function getInputWithNewLine(
  inputName: string,
  isPrefix: boolean,
  options?: core.InputOptions
): string {
  let input = core.getInput(inputName, options)
  if (input !== '') {
    if (isPrefix) {
      input += '\r\n'
    } else {
      input = `\r\n${input}`
    }
  }
  return input
}

export function setInput(name: string, value: string): void {
  const inputName = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`
  process.env[inputName] = value
}
