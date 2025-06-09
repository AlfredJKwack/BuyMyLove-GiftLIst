import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchGifts, addGift, updateGift, deleteGift, toggleBoughtStatus } from '../src/services/giftService';
import { supabase } from '../src/services/supabase';
import { getCookieId, setCookieId } from '../src/utils/cookies';

// Mock fetch for Edge Functions
global.fetch = vi.fn();

// Mock the Supabase client
vi.mock('../src/services/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    auth: {
      getSession: vi.fn(),
    },
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn().mockReturnThis(),
      getPublicUrl: vi.fn().mockReturnThis(),
    },
  },
}));

// Mock the cookie utilities
vi.mock('../src/utils/cookies', () => ({
  getCookieId: vi.fn(),
  setCookieId: vi.fn(),
}));

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

describe('Gift Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchGifts', () => {
    it('should fetch gifts successfully', async () => {
      const mockGifts = [
        { id: '1', title: 'Gift 1', hyperlink: 'https://example.com/1' },
        { id: '2', title: 'Gift 2', hyperlink: 'https://example.com/2' },
      ];

      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.order.mockResolvedValue({ data: mockGifts, error: null });

      const result = await fetchGifts();

      expect(supabase.from).toHaveBeenCalledWith('gifts');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.order).toHaveBeenCalledWith('date_added', { ascending: false });
      expect(result).toEqual(mockGifts);
    });

    it('should return an empty array on error', async () => {
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.order.mockResolvedValue({ data: null, error: new Error('Database error') });

      const result = await fetchGifts();

      expect(result).toEqual([]);
    });
  });

  describe('addGift', () => {
    it('should add a gift successfully via Edge Function', async () => {
      const newGift = {
        title: 'New Gift',
        hyperlink: 'https://example.com/new',
        note: 'Test note',
      };

      const mockResponseData = {
        success: true,
        data: { ...newGift, id: '123', bought: false, date_added: new Date().toISOString() },
      };

      // Mock auth session for admin operations
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      });

      // Mock fetch for Edge Function call
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponseData),
      });

      const result = await addGift(newGift);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/add-gift',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'authorization': 'Bearer test-token',
          }),
          body: JSON.stringify({
            title: newGift.title,
            hyperlink: newGift.hyperlink,
            note: newGift.note,
            imagePath: null,
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponseData.data);
    });

    it('should handle errors when adding a gift via Edge Function', async () => {
      const newGift = {
        title: 'New Gift',
        hyperlink: 'https://example.com/new',
      };

      // Mock auth session
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      });

      // Mock fetch error
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const result = await addGift(newGift);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });
  });

  describe('toggleBoughtStatus', () => {
    it('should toggle bought status successfully via Edge Function', async () => {
      const giftId = '123';
      const mockCookieId = 'test-cookie-123';
      getCookieId.mockReturnValue(mockCookieId);

      const mockResponseData = {
        success: true,
        data: {
          id: giftId,
          title: 'Test Gift',
          bought: true,
          bought_by_cookie: mockCookieId,
        },
      };

      // Mock fetch for Edge Function call
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponseData),
      });

      const result = await toggleBoughtStatus(giftId, true);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/toggle-bought-status',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-gift-buyer-id': mockCookieId,
          }),
          body: JSON.stringify({
            giftId,
            bought: true,
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data.bought).toBe(true);
      expect(result.data.bought_by_cookie).toBe(mockCookieId);
    });

    it('should handle errors when toggling bought status via Edge Function', async () => {
      const giftId = '123';
      const mockCookieId = 'test-cookie-123';
      getCookieId.mockReturnValue(mockCookieId);

      // Mock fetch error
      global.fetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'You cannot unmark a gift that was marked by someone else' }),
      });

      const result = await toggleBoughtStatus(giftId, false);

      expect(result.success).toBe(false);
      expect(result.error).toBe('You cannot unmark a gift that was marked by someone else');
    });
  });
});
