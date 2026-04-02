import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// NOTE: 401 handling (token refresh + logout) is fully managed by authInterceptor.
// This interceptor only handles non-401 errors for logging/formatting purposes.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only log non-401 errors here; 401s are handled by authInterceptor
      if (error.status !== 401) {
        const errorMessage = error.error?.message || error.statusText || 'An error occurred';
        console.error(`[HTTP ${error.status}] ${req.url}:`, errorMessage);
      }
      return throwError(() => error);
    })
  );
};
