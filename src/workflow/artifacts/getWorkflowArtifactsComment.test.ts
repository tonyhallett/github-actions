import {getInputOrDefault} from '../../helpers/getInputOrDefault'
import {WorkflowArtifactDetails} from './getWorkflowArtifactDetails'
import {getWorkflowArtifactsComment} from './getWorkflowArtifactsComment'
let mockWorkflowArtifactDetails: WorkflowArtifactDetails[]

let mockIncludesFormatted = ''
let mockFormat = ''
let mockIncludes: string[] = []

jest.mock('../../helpers/getInputOrDefault', () => {
  return {
    getInputOrDefault: jest.fn((inputName: string) => {
      if (inputName === 'format') {
        return mockFormat
      }
      throw new Error('unexpected')
    })
  }
})
jest.mock('@actions/core', () => {
  const mockedCore: Partial<typeof import('@actions/core')> = {
    getInput(name) {
      switch (name) {
        case 'includesFormatted':
          return mockIncludesFormatted
        default:
          throw new Error('unknown input name')
      }
    },
    setOutput: jest.fn(),
    error: jest.fn(),
    debug: () => {}
  }
  return mockedCore
})
jest.mock('./getWorkflowArtifactDetails', () => {
  return {
    async getWorkflowArtifactDetails() {
      return mockWorkflowArtifactDetails
    }
  }
})
jest.mock('../../helpers/inputHelpers', () => {
  return {
    getCommaDelimitedStringArrayInput: jest.fn((inputName: string) => {
      if (inputName !== 'includes') {
        throw new Error('unexpected')
      }
      return mockIncludes
    }),
    getInputWithNewLine: jest.fn((inputName: string, isPrefix: boolean) => {
      return `${inputName}${isPrefix}`
    })
  }
})
describe('getWorkflowArtifactsComment', () => {
  beforeEach(() => {
    mockFormat = 'url'
    mockIncludesFormatted = ''
  })

  it('should return null when no artifacts', async () => {
    mockWorkflowArtifactDetails = []
    expect(await getWorkflowArtifactsComment()).toBeNull()
  })
  describe('has artifacts', () => {
    beforeEach(() => {
      mockWorkflowArtifactDetails = [
        {
          name: 'artifact1',
          id: 1,
          httpUrl: 'url1'
        },
        {
          name: 'artifact2',
          id: 2,
          httpUrl: 'url2'
        }
      ]
    })
    describe('formatting same for all', () => {
      describe('does not exclude artifacts with include when no include input', () => {
        describe('should use prefix and suffix inputs ( with new lines where necessary) for formatted artifact details each on a new line', () => {
          it('should default format to url', async () => {
            await getWorkflowArtifactsComment()
            expect(getInputOrDefault).toHaveBeenCalledWith(
              'format',
              expect.any(Function),
              {defaultValue: 'url'}
            )
            // does not transform
            expect(
              (getInputOrDefault as jest.Mock).mock.calls[0][1](
                'doesnottransform'
              )
            ).toEqual('doesnottransform')
          })

          it('should use httpUrl when url format', async () => {
            mockFormat = 'url'
            const artifactsComment = await getWorkflowArtifactsComment()
            expect(artifactsComment).toEqual(
              'prefixtrueurl1\r\nurl2suffixfalse'
            )
          })
          it('should use markdown name and httpUrl when name format', async () => {
            mockFormat = 'name'
            const artifactsComment = await getWorkflowArtifactsComment()
            expect(artifactsComment).toEqual(
              'prefixtrue[artifact1](url1)\r\n[artifact2](url2)suffixfalse'
            )
          })
          it('should use format string with name and url replacement', async () => {
            mockFormat = 'Artifact name is {name}, and url is {url}'
            const artifactsComment = await getWorkflowArtifactsComment()
            expect(artifactsComment).toEqual(
              'prefixtrueArtifact name is artifact1, and url is url1\r\nArtifact name is artifact2, and url is url2suffixfalse'
            )
          })
        })
      })

      it('should only include those in include when include input', async () => {
        mockWorkflowArtifactDetails = [
          {
            name: 'artifact1',
            id: 1,
            httpUrl: 'url1'
          },
          {
            name: 'artifact3',
            id: 3,
            httpUrl: 'url3'
          },
          {
            name: 'artifact2',
            id: 2,
            httpUrl: 'url2'
          }
        ]
        mockIncludes = ['artifact1', 'artifact2']
        mockFormat = 'url'
        const artifactsComment = await getWorkflowArtifactsComment()
        expect(artifactsComment).toEqual('prefixtrueurl1\r\nurl2suffixfalse')
      })
    })

    describe('formatting specified for each artifact with includesFormatted input', () => {
      it('should default to url format if not specified for an included artifact', async () => {
        mockIncludesFormatted = JSON.stringify([
          {name: 'artifact1'},
          {name: 'artifact2'}
        ])
        const artifactsComment = await getWorkflowArtifactsComment()
        expect(artifactsComment).toEqual('prefixtrueurl1\r\nurl2suffixfalse')
      })

      it('should exclude artifacts without an including array entry', async () => {
        mockIncludesFormatted = JSON.stringify([{name: 'artifact2'}])
        const artifactsComment = await getWorkflowArtifactsComment()
        expect(artifactsComment).toEqual('prefixtrueurl2suffixfalse')
      })

      it('should allow formatting differently', async () => {
        mockIncludesFormatted = JSON.stringify([
          {name: 'artifact1', format: 'name'},
          {
            name: 'artifact2',
            format: 'Artifact name is {name}, and url is {url}'
          }
        ])

        const artifactsComment = await getWorkflowArtifactsComment()
        expect(artifactsComment).toEqual(
          'prefixtrue[artifact1](url1)\r\nArtifact name is artifact2, and url is url2suffixfalse'
        )
      })
    })
  })
})
