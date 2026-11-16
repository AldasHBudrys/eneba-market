import { describe, expect, it } from 'vitest'
import { safeNext } from './auth'

// After login we redirect to ?next=… — it must stay on this site, or a crafted link could send users to a phishing page.
describe('safeNext', () => {
  it('keeps paths on this site', () => {
    expect(safeNext('/checkout')).toBe('/checkout')
    expect(safeNext('/store?platform=steam')).toBe('/store?platform=steam')
  })

  it.each(['//evil.com', '/\\evil.com', 'https://evil.com', 'checkout', '', null])('rejects %j → home', (next) => {
    expect(safeNext(next)).toBe('/')
  })
})
