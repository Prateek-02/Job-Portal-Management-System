import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, filter, take, throwError, BehaviorSubject } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const authService = inject(AuthService);
  const token = storageService.getToken();

  // If token exists, add it to the header
  let authReq = req;
  if (token && !req.url.includes('/auth/refresh')) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If error is not 401, or it's a login/refresh request that failed with 401, don't intercept
      const isPublicAuthRoute = 
        req.url.includes('/auth/login') || 
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/forgot-password') ||
        req.url.includes('/auth/reset-password') ||
        req.url.includes('/auth/register');

      if (error.status !== 401 || isPublicAuthRoute) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        // If already refreshing, wait for the token to be available
        return refreshTokenSubject.pipe(
          filter(t => t !== null),
          take(1),
          switchMap((jwt) => {
            // Retry queued request with the refreshed access token
            return next(req.clone({
              headers: req.headers.set('Authorization', `Bearer ${jwt}`)
            }));
          })
        );
      }

      // Start refreshing token
      isRefreshing = true;
      refreshTokenSubject.next(null);

      // We only proceed if we have a refresh token.
      // If there's no refresh token, the user was never authenticated (or session fully expired).
      // Only call logout() if we previously had a token (session expired mid-use).
      // Never force-redirect anonymous users who were never logged in.
      const refreshToken = storageService.getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        // Only clear auth state if there was an active session token
        if (storageService.hasToken()) {
          authService.logout();
        }
        return throwError(() => error);
      }

      return authService.refreshToken().pipe(
        switchMap((res: any) => {
          isRefreshing = false;
          const newToken = res.accessToken;
          refreshTokenSubject.next(newToken);

          return next(req.clone({
            headers: req.headers.set('Authorization', `Bearer ${newToken}`)
          }));
        }),
        catchError((refreshError) => {
          // If refresh fails (e.g., refresh token expired), force logout
          isRefreshing = false;
          authService.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
