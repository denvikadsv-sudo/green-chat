import { describe, it, expect } from 'vitest'
import { normalizePhone, toChatId, formatPhone, resolveApiUrl } from './phone.js'

describe('normalizePhone', () => {
  it('strips formatting', () => expect(normalizePhone('+7 (999) 123-45-67')).toBe('79991234567'))
  it('converts leading 8 to 7', () => expect(normalizePhone('8 999 123 45 67')).toBe('79991234567'))
  it('rejects short input', () => expect(normalizePhone('12345')).toBeNull())
  it('rejects empty input', () => expect(normalizePhone('')).toBeNull())
})

describe('helpers', () => {
  it('builds chatId', () => expect(toChatId('79991234567')).toBe('79991234567@c.us'))
  it('formats russian phone', () => expect(formatPhone('79991234567')).toBe('+7 999 123-45-67'))
  it('derives apiUrl from 10-digit instance', () =>
    expect(resolveApiUrl('7103123456')).toBe('https://7103.api.green-api.com'))
  it('falls back to default apiUrl', () =>
    expect(resolveApiUrl('110012345')).toBe('https://api.green-api.com'))
})
