import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorStateService } from '../services/error-state.service';

/** Routes that should NEVER trigger full-page error navigation.
 *  Errors from these are handled inline by their calling components. */
const SILENT_URLS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-otp',
  '/public/',
];

/** HTTP status codes that we route to a dedicated error page. */
const ROUTABLE_STATUSES = new Set([403, 404, 500, 502, 503, 504]);

function isSilent(url: string): boolean {
  return SILENT_URLS.some(path => url.includes(path));
}

// NOTE: 401s are fully handled by the authInterceptor (token refresh → logout).
// This interceptor handles all other errors and routes to the appropriate error page.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const errorState = inject(ErrorStateService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip 401 — authInterceptor owns that
      if (error.status === 401 || isSilent(req.url)) {
        return throwError(() => error);
      }

      const message =
        error.error?.message ||
        error.error?.error ||
        error.message ||
        error.statusText ||
        'An unexpected error occurred.';

      console.error(`[HTTP ${error.status}] ${req.url} — ${message}`);

      // Navigate to a full-page error view for critical errors
      if (ROUTABLE_STATUSES.has(error.status)) {
        errorState.set({
          status: error.status,
          message,
          url: req.url,
          timestamp: new Date().toISOString()
        });

        const routeMap: Record<number, string> = {
          403: '/error/403',
          404: '/error/404',
          500: '/error/500',
          502: '/error/500',
          503: '/error/500',
          504: '/error/500',
        };

        router.navigate([routeMap[error.status] ?? '/error/500'], { replaceUrl: true });
      } else if (error.status === 0) {
        // Network / CORS failure
        errorState.set({
          status: 0,
          message: 'Unable to reach the server. Please check your internet connection.',
          url: req.url,
          timestamp: new Date().toISOString()
        });
        router.navigate(['/error/network'], { replaceUrl: true });
      }

      // Always re-throw so individual components can still handle errors inline
      return throwError(() => error);
    })
  );
};
