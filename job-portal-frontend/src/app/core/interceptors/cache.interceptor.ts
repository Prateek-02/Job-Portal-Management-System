import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { CacheService } from '../services/cache.service';

/** Routes that shouldn't be cached to ensure fresh data always (e.g., auth specific calls) */
const NOT_CACHEABLE_ROUTES = [
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

function isCacheable(req: HttpRequest<any>): boolean {
  if (req.method !== 'GET') {
    return false;
  }
  const isMatch = NOT_CACHEABLE_ROUTES.some(route => req.url.includes(route));
  if (isMatch) {
    return false;
  }
  return true;
}

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cacheService = inject(CacheService);

  // If this is a mutation command (POST, PUT, PATCH, DELETE)
  // we want to invalidate caches related to what changed.
  if (req.method !== 'GET') {
    return next(req).pipe(
      tap({
        next: () => {
          // Safety blanket:
          // A mutation occurred. To keep the frontend consistent,
          // we invalidate cache entries related to the main entity.
          // e.g. if POST /api/jobs, clear anything with /jobs
          
          if (req.url.includes('/jobs')) cacheService.invalidateByPartialMatch('/jobs');
          if (req.url.includes('/applications')) cacheService.invalidateByPartialMatch('/applications');
          if (req.url.includes('/users') || req.url.includes('/profile')) cacheService.invalidateByPartialMatch('/auth/users');
          if (req.url.includes('/profile-image')) cacheService.invalidateByPartialMatch('/auth/profile');
          if (req.url.includes('/admin')) cacheService.invalidateByPartialMatch('/admin');

          // If the mutation is massive (like login/logout/register etc.), clear everything
          if (req.url.includes('/auth/') && !req.url.includes('/users')) {
            cacheService.clearAll();
          }
        }
      })
    );
  }

  // Not a cacheable request type? Pass it directly and skip caching logic.
  if (!isCacheable(req)) {
     return next(req);
  }

  // Check cache
  const cachedResponse = cacheService.get(req);
  if (cachedResponse) {
    // Return cached value as an Observable
    return of(cachedResponse);
  }

  // Proceed with external request, and cache the result if successful
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
         cacheService.put(req, event);
      }
    })
  );
};
