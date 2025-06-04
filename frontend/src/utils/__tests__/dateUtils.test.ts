import { describe, it, expect, beforeEach, vi } from 'vitest'
import { formatDate, formatRelativeTime } from '../dateUtils'

describe('dateUtils', () => {
  beforeEach(() => {
    // reset system time before each test
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2023-10-15T12:00:00Z'))
  })

  it('formats date in pt-BR', () => {
    expect(formatDate('2023-10-15')).toBe('15 de out. de 2023')
  })

  it('formats relative time values', () => {
    expect(formatRelativeTime('2023-10-15T11:59:00Z')).toBe('1m atrás')
    expect(formatRelativeTime('2023-10-15T11:00:00Z')).toBe('1h atrás')
    expect(formatRelativeTime('2023-10-14T12:00:00Z')).toBe('1d atrás')
    expect(formatRelativeTime('2023-10-01T12:00:00Z')).toBe('1 de out. de 2023')
  })
})
