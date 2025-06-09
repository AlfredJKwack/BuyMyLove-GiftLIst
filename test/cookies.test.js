import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCookie, setCookie, getCookieId, setCookieId } from '../src/utils/cookies';

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

describe('Cookie Utilities', () => {
  beforeEach(() => {
    // Clear cookies before each test
    document.cookie = '';
    vi.clearAllMocks();
    
    // Mock crypto.randomUUID for this test suite
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('test-uuid-123');
  });

  describe('getCookie', () => {
    it('should return null when cookie does not exist', () => {
      document.cookie = 'other_cookie=value';
      const result = getCookie('nonexistent');
      expect(result).toBeNull();
    });

    it('should return cookie value when cookie exists', () => {
      document.cookie = 'test_cookie=test_value';
      const result = getCookie('test_cookie');
      expect(result).toBe('test_value');
    });

    it('should handle multiple cookies and return correct value', () => {
      document.cookie = 'cookie1=value1; cookie2=value2; cookie3=value3';
      const result = getCookie('cookie2');
      expect(result).toBe('value2');
    });

    it('should handle cookies with spaces around them', () => {
      document.cookie = ' cookie1=value1 ; cookie2=value2 ';
      const result = getCookie('cookie2');
      expect(result).toBe('value2');
    });
  });

  describe('setCookie', () => {
    it('should set a cookie with correct format', () => {
      const mockDate = new Date('2024-01-01T00:00:00Z');
      vi.spyOn(Date.prototype, 'getTime').mockReturnValue(mockDate.getTime());
      vi.spyOn(Date.prototype, 'setTime').mockImplementation(function(time) {
        this.mockTime = time;
      });
      vi.spyOn(Date.prototype, 'toUTCString').mockReturnValue('Mon, 01 Jan 2024 00:00:00 GMT');

      setCookie('test_cookie', 'test_value', 7);

      expect(document.cookie).toContain('test_cookie=test_value');
      expect(document.cookie).toContain('expires=Mon, 01 Jan 2024 00:00:00 GMT');
      expect(document.cookie).toContain('path=/');
      expect(document.cookie).toContain('SameSite=Lax');
    });
  });

  describe('getCookieId', () => {
    it('should return existing cookie ID when it exists', () => {
      document.cookie = 'gift_buyer_id=existing-id-123';
      const result = getCookieId();
      expect(result).toBe('existing-id-123');
    });

    it('should create and return new cookie ID when it does not exist', () => {
      const result = getCookieId();
      expect(result).toBe('test-uuid-123');
      expect(crypto.randomUUID).toHaveBeenCalledOnce();
      expect(document.cookie).toContain('gift_buyer_id=test-uuid-123');
    });
  });

  describe('setCookieId', () => {
    it('should set the gift buyer ID cookie', () => {
      setCookieId('custom-id-456');
      expect(document.cookie).toContain('gift_buyer_id=custom-id-456');
    });
  });
});
