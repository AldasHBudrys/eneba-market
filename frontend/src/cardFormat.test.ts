import { describe, expect, it } from 'vitest'
import { formatCardNumber, formatCvc, formatExpiry } from './cardFormat'

describe('card field formatting', () => {
  it('groups the card number in fours, drops non-digits, stops at 16 digits', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242')
    expect(formatCardNumber('4242-4242-4242-4242')).toBe('4242 4242 4242 4242') // pasted with dashes
    expect(formatCardNumber('42424')).toBe('4242 4')
    expect(formatCardNumber('4242 ')).toBe('4242') // no trailing space, so Backspace never gets stuck
    expect(formatCardNumber('42424242424242429999')).toBe('4242 4242 4242 4242')
  })

  it('adds the expiry "/" only from the 3rd digit', () => {
    expect(formatExpiry('1')).toBe('1')
    expect(formatExpiry('12')).toBe('12') // Backspace over "12/" leaves "12", not stuck on the slash
    expect(formatExpiry('122')).toBe('12/2')
    expect(formatExpiry('1228')).toBe('12/28')
    expect(formatExpiry('12/289')).toBe('12/28')
  })

  it('keeps CVC to 3 digits', () => {
    expect(formatCvc('12a34')).toBe('123')
  })
})
