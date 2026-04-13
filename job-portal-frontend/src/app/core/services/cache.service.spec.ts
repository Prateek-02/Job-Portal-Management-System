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
      
      // Mock setItem to throw exception
      vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Should not crash the application
      expect(() => service.put(mockReq, mockRes)).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Session storage quota exceeded while caching API response.');
      
      // In-memory cache should still work as fallback
      const cached = service.get(mockReq);
      expect(cached?.body).toEqual('test');
      
      vi.restoreAllMocks();
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

      // Create a fresh instance to trigger constructor hydration
      const newService = new CacheService();

      // The corrupt one should be ignored/removed
      expect(sessionStorage.getItem('jp_cache_/api/corrupt')).toBeNull();
      
      // The valid one should be hydrated
      const validReq = new HttpRequest('GET', '/api/valid');
      expect(newService.get(validReq)).toBeTruthy();
    });
  });
});
