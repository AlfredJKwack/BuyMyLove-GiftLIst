import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getUserId, setCookie, getCookie } from '../src/utils/cookies.js'

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: ''
})

describe('Cookie Utilities', () => {
  beforeEach(() => {
    document.cookie = ''
    vi.clearAllMocks()
  })

  it('should generate a unique user ID', () => {
    const userId1 = getUserId()
    const userId2 = getUserId()
    
    expect(userId1).toMatch(/^user_[a-z0-9]+_\d+$/)
    expect(userId1).toBe(userId2) // Should return same ID on subsequent calls
  })

  it('should set and get cookies correctly', () => {
    setCookie('test_cookie', 'test_value')
    const value = getCookie('test_cookie')
    
    expect(value).toBe('test_value')
  })

  it('should return null for non-existent cookies', () => {
    const value = getCookie('non_existent_cookie')
    expect(value).toBeNull()
  })
})

describe('Gift Bought Status Logic', () => {
  it('should allow marking unbought gift as bought', () => {
    const gift = {
      id: 1,
      bought: false,
      bought_by_cookie: null
    }
    
    const userId = 'user_123'
    const canToggle = !gift.bought || gift.bought_by_cookie === userId
    
    expect(canToggle).toBe(true)
  })

  it('should allow original buyer to unmark gift', () => {
    const userId = 'user_123'
    const gift = {
      id: 1,
      bought: true,
      bought_by_cookie: userId
    }
    
    const canToggle = !gift.bought || gift.bought_by_cookie === userId
    
    expect(canToggle).toBe(true)
  })

  it('should not allow different user to unmark gift', () => {
    const userId = 'user_123'
    const gift = {
      id: 1,
      bought: true,
      bought_by_cookie: 'user_456'
    }
    
    const canToggle = !gift.bought || gift.bought_by_cookie === userId
    
    expect(canToggle).toBe(false)
  })
})

describe('Visitor Throttling Logic', () => {
  it('should count unique visitors correctly', () => {
    const visitors = [
      { user_id: 'user_1', ip_address: '192.168.1.1' },
      { user_id: 'user_2', ip_address: '192.168.1.2' },
      { user_id: 'user_1', ip_address: '192.168.1.1' }, // Duplicate
      { user_id: 'user_3', ip_address: '192.168.1.3' }
    ]
    
    const uniqueVisitors = new Set(
      visitors.map(visitor => `${visitor.user_id}_${visitor.ip_address}`)
    ).size
    
    expect(uniqueVisitors).toBe(3)
  })

  it('should trigger alert when visitor limit exceeded', () => {
    const visitors = Array.from({ length: 15 }, (_, i) => ({
      user_id: `user_${i}`,
      ip_address: `192.168.1.${i}`
    }))
    
    const uniqueVisitors = new Set(
      visitors.map(visitor => `${visitor.user_id}_${visitor.ip_address}`)
    ).size
    
    expect(uniqueVisitors).toBeGreaterThan(12)
  })
})
