import { TestBed } from '@angular/core/testing';
import { CacheService } from './cache.service';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { vi } from 'vitest';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    // Clear storage to ensure isolated tests
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('put() and get()', () => {
    // Normal working
    it('should store and retrieve HTTP responses successfully', () => {
      const mockReq = new HttpRequest('GET', '/api/test');
      const mockRes = new HttpResponse({ body: { data: 'test data' }, status: 200 });

      service.put(mockReq, mockRes);
      
      const cached = service.get(mockReq);
      expect(cached).toBeTruthy();
      expect(cached?.body).toEqual({ data: 'test data' });
      expect(cached?.status).toBe(200);
      
      // Should be in session storage too
      const storedItem = sessionStorage.getItem('jp_cache_/api/test');
      expect(storedItem).toBeTruthy();
      expect(JSON.parse(storedItem!).response.body).toEqual({ data: 'test data' });
    });

    // Boundary value
    it('should expire items exactly at the 5-minute MAX_AGE boundary (simulated)', () => {
      const mockReq = new HttpRequest('GET', '/api/boundary');
      const mockRes = new HttpResponse({ body: 'boundary data' });
      
      // Store initially
      service.put(mockReq, mockRes);
      
      // Spy on Date.now to simulate exactly 5 minutes + 1ms later
      const futureTime = Date.now() + (5 * 60 * 1000) + 1;
      vi.spyOn(Date, 'now').mockReturnValue(futureTime);

      const cached = service.get(mockReq);
      expect(cached).toBeNull(); // Should be considered expired
      expect(sessionStorage.getItem('jp_cache_/api/boundary')).toBeNull(); // Should be cleaned up
      
      vi.restoreAllMocks();
    });

    // Exception handling
    it('should handle QuotaExceededError when sessionStorage is full without crashing', () => {
      const mockReq = new HttpRequest('GET', '/api/quota-test');
      const mockRes = new HttpResponse({ body: 'test' });
      
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { 
        throw new Error('QuotaExceededError'); 
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      service.put(mockReq, mockRes);

      // In-memory cache should still work as fallback
      const cached = service.get(mockReq);
      expect(cached?.body).toEqual('test');
      
      setItemSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('invalidateByPartialMatch()', () => {
    // Normal working
    it('should clear specific endpoints matching the partial URL', () => {
      const req1 = new HttpRequest('GET', '/api/jobs?page=0');
      const req2 = new HttpRequest('GET', '/api/jobs/123');
      const req3 = new HttpRequest('GET', '/api/users');
      
      service.put(req1, new HttpResponse({}));
      service.put(req2, new HttpResponse({}));
      service.put(req3, new HttpResponse({}));

      service.invalidateByPartialMatch('/api/jobs');

      expect(service.get(req1)).toBeNull();
      expect(service.get(req2)).toBeNull();
      expect(service.get(req3)).toBeTruthy(); // Should remain
    });
  });

  describe('hydrateFromStorage()', () => {
    // Exception handling (corrupted JSON)
    it('should handle corrupted JSON in sessionStorage safely upon initialization', () => {
      // Simulate corrupted data
      sessionStorage.setItem('jp_cache_/api/corrupt', '{ invalidJson: }');
      sessionStorage.setItem('jp_cache_/api/valid', JSON.stringify({
        url: '/api/valid',
        response: { body: 'ok' },
        entryTime: Date.now()
      }));
      const keysSpy = vi.spyOn(Object, 'keys').mockImplementation((obj: any) => {
        if (obj === sessionStorage) return ['jp_cache_/api/corrupt', 'jp_cache_/api/valid'];
        return Reflect.ownKeys(obj).map(k => String(k));
      });

      // Create a fresh instance to trigger constructor hydration
      const newService = new CacheService();

      // The corrupt one should be ignored/removed
      expect(sessionStorage.getItem('jp_cache_/api/corrupt')).toBeNull();
      
      // The valid one should be hydrated
      expect(sessionStorage.getItem('jp_cache_/api/valid')).toBeTruthy();
      const validReq = new HttpRequest('GET', '/api/valid');
      expect(newService.get(validReq)?.body).toBe('ok');
      keysSpy.mockRestore();
    });

    it('should remove expired entries during hydration', () => {
      sessionStorage.setItem('jp_cache_/api/expired', JSON.stringify({
        url: '/api/expired',
        response: { body: 'old' },
        entryTime: Date.now() - (6 * 60 * 1000)
      }));
      const keysSpy = vi.spyOn(Object, 'keys').mockImplementation((obj: any) => {
        if (obj === sessionStorage) return ['jp_cache_/api/expired'];
        return Reflect.ownKeys(obj).map(k => String(k));
      });

      const newService = new CacheService();
      expect(sessionStorage.getItem('jp_cache_/api/expired')).toBeNull();
      expect(newService.get(new HttpRequest('GET', '/api/expired'))).toBeNull();
      keysSpy.mockRestore();
    });

  });

  describe('clearAll()', () => {
    it('should clear all cache-prefixed storage keys only', () => {
      sessionStorage.setItem('jp_cache_/api/a', '{}');
      sessionStorage.setItem('jp_cache_/api/b', '{}');
      sessionStorage.setItem('other_key', 'persist');
      const keysSpy = vi.spyOn(Object, 'keys').mockImplementation((obj: any) => {
        if (obj === sessionStorage) return ['jp_cache_/api/a', 'jp_cache_/api/b', 'other_key'];
        return Reflect.ownKeys(obj).map(k => String(k));
      });
      expect(() => service.clearAll()).not.toThrow();
      expect(sessionStorage.getItem('jp_cache_/api/a')).toBeNull();
      expect(sessionStorage.getItem('jp_cache_/api/b')).toBeNull();
      expect(sessionStorage.getItem('other_key')).toBe('persist');
      keysSpy.mockRestore();
    });
  });
});
