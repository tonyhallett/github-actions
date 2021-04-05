import * as core from '@actions/core'

export async function trySetFailedAsync(
  action: () => Promise<void>
): Promise<void> {
  try {
    await action()
  } catch (e) {
    core.setFailed(e)
  }
}
