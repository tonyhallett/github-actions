import * as core from '@actions/core'
export function debugIf(debug: boolean, message: string): void {
  if (debug) {
    core.debug(message)
  }
}
