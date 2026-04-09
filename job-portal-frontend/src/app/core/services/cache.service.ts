import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';

export interface CacheEntry {
  url: string;
  response: any;
  entryTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cacheMap = new Map<string, CacheEntry>();
  // Max age in milliseconds (currently 5 minutes)
  private readonly MAX_AGE = 5 * 60 * 1000;
  private readonly STORAGE_PREFIX = 'jp_cache_';

  constructor() {
    this.hydrateFromStorage();
  }

  /**
   * Retrieves a cached response if it exists and is still valid.
   */
  get(req: HttpRequest<any>): HttpResponse<any> | null {
    const urlWithParams = req.urlWithParams;
    const entry = this.cacheMap.get(urlWithParams);

    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.entryTime > this.MAX_AGE;
    if (isExpired) {
      this.cacheMap.delete(urlWithParams);
      sessionStorage.removeItem(this.STORAGE_PREFIX + urlWithParams);
      return null;
    }

    // Reconstruct HttpResponse
    return new HttpResponse(entry.response);
  }

  /**
   * Saves a valid response into both memory and session storage.
   */
  put(req: HttpRequest<any>, response: HttpResponse<any>): void {
    const urlWithParams = req.urlWithParams;
    const entry: CacheEntry = {
      url: urlWithParams,
      response: {
        body: response.body,
        status: response.status,
        statusText: response.statusText,
        url: response.url || urlWithParams
      },
      entryTime: Date.now()
    };

    this.cacheMap.set(urlWithParams, entry);
    // Protect against quota exceeded errors in sessionStorage
    try {
      sessionStorage.setItem(this.STORAGE_PREFIX + urlWithParams, JSON.stringify(entry));
    } catch (e) {
      console.warn('Session storage quota exceeded while caching API response.');
    }
  }

  /**
   * Clears out any specific endpoint matches (useful for targeted invalidation on mutation)
   * E.g., if we POST /jobs, we should probably clear anything containing '/jobs'
   */
  invalidateByPartialMatch(partialUrl: string): void {
    const keysToRemove: string[] = [];

    this.cacheMap.forEach((entry, key) => {
      if (key.includes(partialUrl)) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => {
      this.cacheMap.delete(key);
      sessionStorage.removeItem(this.STORAGE_PREFIX + key);
    });
  }

  /**
   * Clears the entire cache (usually done on logout or massive mutation like complete data reset)
   */
  clearAll(): void {
    this.cacheMap.clear();
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  }

  /**
   * Restores cache state from sessionStorage
   */
  private hydrateFromStorage(): void {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        try {
          const item = sessionStorage.getItem(key);
          if (item) {
             const entry: CacheEntry = JSON.parse(item);
             // Verify it's not already expired at boot time
             if (Date.now() - entry.entryTime > this.MAX_AGE) {
               sessionStorage.removeItem(key);
             } else {
               // Strip the prefix to get the original URL key
               const urlKey = key.substring(this.STORAGE_PREFIX.length);
               this.cacheMap.set(urlKey, entry);
             }
          }
        } catch(e) {
          // If corrupted, remove it
          sessionStorage.removeItem(key);
        }
      }
    }
  }
}
