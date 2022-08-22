import {getInputOrDefault} from './getInputOrDefault'

describe('getInputOrDefault', () => {
  it('should not throw error when default value and no input', () => {
    // would not have default and required - required gets ignored
    expect(() =>
      getInputOrDefault('notInput', input => input, {
        defaultValue: 'default',
        required: true
      })
    ).not.toThrow()
  })

  it('should return the default value if no input', () => {
    expect(
      getInputOrDefault('notInput', input => input, {
        defaultValue: 'default',
        required: true
      })
    ).toBe('default')
  })

  it('should transform the input when default value and has input', () => {
    const input = 'the input'
    process.env['INPUT_HASINPUT'] = input
    expect(
      getInputOrDefault('hasInput', inp => `${inp}TRANSFORMED`, {
        defaultValue: 'default',
        required: true
      })
    ).toBe('the inputTRANSFORMED')
  })

  it('should throw error when no default value, no input and required', () => {
    expect(() =>
      getInputOrDefault('notInput', input => input, {required: true})
    ).toThrowError()
  })

  it('should transform the input when no default value and input', () => {
    const input = 'the input'
    process.env['INPUT_HASINPUT'] = input
    expect(
      getInputOrDefault('hasInput', inp => `${inp}TRANSFORMED`, {
        required: true
      })
    ).toBe('the inputTRANSFORMED')
  })

  it('should work with no options', () => {
    const input = 'the input'
    process.env['INPUT_HASINPUT'] = input
    expect(getInputOrDefault('hasInput', inp => `${inp}TRANSFORMED`)).toBe(
      'the inputTRANSFORMED'
    )
  })
})
