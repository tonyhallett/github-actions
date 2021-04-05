/* eslint-disable prefer-rest-params */
import * as core from '@actions/core'
import {getInputOrDefault} from '../../helpers'
import {
  getInputWithNewLine,
  getCommaDelimitedStringArrayInput
} from '../../helpers/inputHelpers'
import {
  getWorkflowArtifactDetails,
  WorkflowArtifactDetails
} from './getWorkflowArtifactDetails'

//https://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
/* istanbul ignore next */
function formatUnicorn(this: string): string {
  'use strict'
  // eslint-disable-next-line no-invalid-this
  let str = this.toString()
  if (arguments.length) {
    const t = typeof arguments[0]
    let key
    const args =
      'string' === t || 'number' === t
        ? Array.prototype.slice.call(arguments)
        : arguments[0]

    for (key in args) {
      str = str.replace(new RegExp(`\\{${key}\\}`, 'gi'), args[key])
    }
  }

  return str
}

declare global {
  interface String {
    formatUnicorn(...args: unknown[]): string
  }
}

String.prototype.formatUnicorn = formatUnicorn

interface IncludeFormatted {
  name: string
  format: string
}

/*
  constructs a comment with links to all or some artifacts from a workflow run
  or from input ( for when using workflow_run_conclusion_dispatch)
*/
const urlFormat = 'url'

export async function getWorkflowArtifactsComment(): Promise<string | null> {
  const defaultFormat = urlFormat
  let artifactDetails = await getWorkflowArtifactDetails()

  if (artifactDetails.length > 0) {
    const prefix = getInputWithNewLine('prefix', true)
    const suffix = getInputWithNewLine('suffix', false)
    const includesFormattedInput = core.getInput('includesFormatted')

    let commentUrls = ''

    if (includesFormattedInput !== '') {
      const includesFormatted: IncludeFormatted[] = JSON.parse(
        includesFormattedInput
      )
      commentUrls = artifactDetails
        .map(ad => {
          let commentUrl: string | undefined
          const includeFormatted = includesFormatted.find(
            incl => incl.name === ad.name
          )
          if (includeFormatted) {
            const format =
              includeFormatted.format === undefined
                ? defaultFormat
                : includeFormatted.format
            commentUrl = getFormatter(format)(ad)
          }
          return commentUrl
        })
        .filter(comment => comment !== undefined)
        .join('\r\n')
    } else {
      const includes = getCommaDelimitedStringArrayInput('includes')
      const format = getInputOrDefault('format', input => input, {
        defaultValue: defaultFormat
      })
      const formatter = getFormatter(format)

      if (includes.length > 0) {
        artifactDetails = artifactDetails.filter(artifact =>
          includes.some(name => name === artifact.name)
        )
      }
      commentUrls = artifactDetails.map(ads => formatter(ads)).join('\r\n')
    }
    return `${prefix}${commentUrls}${suffix}`
  }
  return null
}

function getFormatter(
  format: string
): (artifactDetails: WorkflowArtifactDetails) => string {
  switch (format) {
    case urlFormat:
      return ads => ads.httpUrl
    case 'name':
      return ads => `[${ads.name}](${ads.httpUrl})`
    default:
      return ads => format.formatUnicorn({name: ads.name, url: ads.httpUrl})
  }
}
