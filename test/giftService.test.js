import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchGifts, addGift, updateGift, deleteGift, toggleBoughtStatus } from '../src/services/giftService';
import { supabase } from '../src/services/supabase';
import { getCookieId, setCookieId } from '../src/utils/cookies';

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
    it('should add a gift successfully', async () => {
      const newGift = {
        title: 'New Gift',
        hyperlink: 'https://example.com/new',
        note: 'Test note',
      };

      const mockResponse = {
        data: [{ ...newGift, id: '123', bought: false, date_added: new Date().toISOString() }],
        error: null,
      };

      supabase.from.mockReturnThis();
      supabase.insert.mockReturnThis();
      supabase.select.mockResolvedValue(mockResponse);

      const result = await addGift(newGift);

      expect(supabase.from).toHaveBeenCalledWith('gifts');
      expect(supabase.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          title: newGift.title,
          hyperlink: newGift.hyperlink,
          note: newGift.note,
          bought: false,
        }),
      ]);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data[0]);
    });

    it('should handle errors when adding a gift', async () => {
      const newGift = {
        title: 'New Gift',
        hyperlink: 'https://example.com/new',
      };

      supabase.from.mockReturnThis();
      supabase.insert.mockReturnThis();
      supabase.select.mockResolvedValue({ data: null, error: new Error('Insert error') });

      const result = await addGift(newGift);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insert error');
    });
  });

  describe('toggleBoughtStatus', () => {
    it('should toggle bought status successfully for unbought gift', async () => {
      const giftId = '123';
      const mockGift = {
        id: giftId,
        title: 'Test Gift',
        bought: false,
        bought_by_cookie: null,
      };

      const mockCookieId = 'test-cookie-123';
      getCookieId.mockReturnValue(mockCookieId);

      // Mock the fetch of the current gift
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.eq.mockReturnThis();
      supabase.single.mockResolvedValueOnce({ data: mockGift, error: null });

      // Mock the update
      supabase.from.mockReturnThis();
      supabase.update.mockReturnThis();
      supabase.eq.mockReturnThis();
      supabase.select.mockResolvedValueOnce({
        data: [{ ...mockGift, bought: true, bought_by_cookie: mockCookieId }],
        error: null,
      });

      const result = await toggleBoughtStatus(giftId, true);

      expect(supabase.from).toHaveBeenCalledWith('gifts');
      expect(supabase.update).toHaveBeenCalledWith({
        bought: true,
        bought_by_cookie: mockCookieId,
      });
      expect(result.success).toBe(true);
      expect(result.data.bought).toBe(true);
      expect(result.data.bought_by_cookie).toBe(mockCookieId);
    });

    it('should prevent unmarking a gift bought by someone else', async () => {
      const giftId = '123';
      const mockGift = {
        id: giftId,
        title: 'Test Gift',
        bought: true,
        bought_by_cookie: 'other-cookie-456',
      };

      const mockCookieId = 'test-cookie-123';
      getCookieId.mockReturnValue(mockCookieId);

      // Mock the fetch of the current gift
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.eq.mockReturnThis();
      supabase.single.mockResolvedValueOnce({ data: mockGift, error: null });

      const result = await toggleBoughtStatus(giftId, false);

      expect(result.success).toBe(false);
      expect(result.error).toBe('You cannot unmark a gift that was marked by someone else');
    });
  });
});
