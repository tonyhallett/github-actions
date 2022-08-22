import {getInput} from '@actions/core'
import {getInputOrDefault, Transformer} from './getInputOrDefault'
import {
  setInput,
  getBoolInput,
  getNumberInput,
  getCommaDelimitedStringArrayInput,
  getInputWithNewLine,
  payloadOrInput
} from './inputHelpers'

let mockGetInput = ''
jest.mock('./getInputOrDefault', () => {
  return {
    getInputOrDefault: jest.fn().mockReturnValue(123)
  }
})

jest.mock('@actions/core', () => {
  return {
    getInput: jest.fn(() => {
      return mockGetInput
    })
  }
})

jest.mock('@actions/github', () => {
  return {
    context: {
      payload: {
        the: 'payload'
      }
    }
  }
})

function expectTransformer<T>(input: string, expected: T): void {
  const transformer: Transformer<T> = (getInputOrDefault as jest.Mock).mock
    .calls[0][1]
  expect(transformer(input)).toEqual(expected)
}

describe('getBoolInput', () => {
  it('should use getInputOrDefault', () => {
    const options = {required: true}
    expect(getBoolInput('inputName', options)).toBe(123)
    expect(getInputOrDefault).toHaveBeenCalledWith(
      'inputName',
      expect.any(Function),
      options
    )
  })
  function expectTransformerBool(input: string, expected: boolean): void {
    getBoolInput('inputName')
    expectTransformer<boolean>(input, expected)
  }
  it("should return true when input is 'true' ", () => {
    expectTransformerBool('true', true)
  })

  it('should return false when no input no default and not required', () => {
    expectTransformerBool('', false)
  })

  it("should return false when input is 'false' ", () => {
    expectTransformerBool('false', false)
  })

  it('should return false for all other input', () => {
    expectTransformerBool('other', false)
  })
})

describe('getNumberInput', () => {
  it('should use getInputOrDefault', () => {
    const options = {required: true}
    expect(getNumberInput('inputName', options)).toBe(123)
    expect(getInputOrDefault).toHaveBeenCalledWith(
      'inputName',
      expect.any(Function),
      options
    )
  })
  function expectTransformerNumber(input: string, expected: number): void {
    getNumberInput('inputName')
    expectTransformer<number>(input, expected)
  }
  it("should return 1 when input is '1' ", () => {
    expectTransformerNumber('1', 1)
  })

  it('should return 0 when no input no default and not required', () => {
    expectTransformerNumber('1', 1)
  })
})

describe('getCommaDelimitedStringArrayInput', () => {
  it('should use getInputOrDefault', () => {
    const options = {required: true}
    expect(getCommaDelimitedStringArrayInput('inputName', options)).toBe(123)
    expect(getInputOrDefault).toHaveBeenCalledWith(
      'inputName',
      expect.any(Function),
      options
    )
  })

  function expectTransformerArray(input: string, expected: string[]): void {
    getCommaDelimitedStringArrayInput('inputName')
    expectTransformer<string[]>(input, expected)
  }

  it('should return empty array when no input no default and not required', () => {
    expectTransformerArray('', [])
  })

  it('should split on comma trimming entries', () => {
    expectTransformerArray('1, 2,  3 , 4', ['1', '2', '3', '4'])
  })
})

describe('getInputWithNewLine', () => {
  it.each([true, false])(
    'should get the input from core - isPrefix %s',
    (isPrefix: boolean) => {
      const options = {required: true}
      getInputWithNewLine('name', isPrefix, options)
      expect(getInput).toHaveBeenCalledWith('name', options)
    }
  )

  it('should return empty string if no input', () => {
    mockGetInput = ''
    expect(getInputWithNewLine('', false)).toEqual('')
  })
  const newline = '\r\n'
  it('should append new line if input and prefix', () => {
    mockGetInput = 'input'
    expect(getInputWithNewLine('', true)).toEqual(`input${newline}`)
  })

  it('should prepend new line if input and suffix', () => {
    mockGetInput = 'input'
    expect(getInputWithNewLine('', false)).toEqual(`${newline}input`)
  })
})

describe('payloadOrInput', () => {
  it('should return the payload if not input', () => {
    mockGetInput = ''
    expect(payloadOrInput('')).toEqual({the: 'payload'})
  })

  it('should return JSON parsed input if input ( not required)', () => {
    mockGetInput = JSON.stringify({thePayload: true})
    expect(payloadOrInput('inputname')).toEqual({thePayload: true})
    expect(getInput).toHaveBeenCalledWith('inputname')
  })
})

describe('set input', () => {
  interface SetInputTest {
    name: string
    expectedInputName: string
    description: string
  }
  const setInputTests: SetInputTest[] = [
    {
      description: 'Prepends INPUT_ and uppercase',
      name: 'someInput',
      expectedInputName: 'INPUT_SOMEINPUT'
    },
    {
      description: 'Should replace spaces with underscores',
      name: 'some input',
      expectedInputName: 'INPUT_SOME_INPUT'
    }
  ]

  for (const test of setInputTests) {
    it(`${test.description}`, () => {
      setInput(test.name, 'value')
      expect(process.env[test.expectedInputName]).toEqual('value')
    })
  }

  it('works with getInput', () => {
    setInput('theInput', 'value')
    const value = jest.requireActual('@actions/core').getInput('theInput')
    expect(value).toEqual('value')
  })
})
