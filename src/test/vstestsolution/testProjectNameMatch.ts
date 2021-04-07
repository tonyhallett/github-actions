import {getStringInput} from '../../helpers'

export function testProjectNameMatch(projectName: string): boolean {
  const regex = getStringInput('testNameRegex', {defaultValue: '/test/i'})
  return regExpFromString(regex).test(projectName)
}

function regExpFromString(inputstring: string): RegExp {
  const flags = inputstring.replace(/.*\/([gimy]*)$/, '$1')
  const pattern = inputstring.replace(new RegExp(`^/(.*?)/${flags}$`), '$1')
  return new RegExp(pattern, flags)
}
