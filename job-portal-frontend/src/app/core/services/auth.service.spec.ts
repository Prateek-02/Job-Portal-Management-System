import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AuthService', () => {
  let service: AuthService;
  let apiServiceMock: any;
  let storageServiceMock: any;
  let notificationServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    apiServiceMock = {
      login: vi.fn(),
      register: vi.fn(),
      refreshToken: vi.fn(),
      getProfile: vi.fn()
    };
    storageServiceMock = {
      getUser: vi.fn(),
      getToken: vi.fn(),
      getRefreshToken: vi.fn(),
      setToken: vi.fn(),
      setRefreshToken: vi.fn(),
      setUser: vi.fn(),
      setUserRole: vi.fn(),
      clear: vi.fn(),
      getUserRole: vi.fn()
    };
    notificationServiceMock = {
      setUserId: vi.fn()
    };
    routerMock = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock },
        { provide: StorageService, useValue: storageServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    // Simulate user already logged in initialization
    storageServiceMock.getUser.mockReturnValue(undefined);
    storageServiceMock.getToken.mockReturnValue(null);
  });

  describe('login()', () => {
    // Normal working
    it('should login normally, save tokens, and navigate state', () => {
      service = TestBed.inject(AuthService); // re-inject to trigger initialization
      const mockLoginResponse = {
        accessToken: 'access123',
        refreshToken: 'refresh123',
        userId: 1,
        name: 'Test',
        email: 'test@test.com',
        role: 'JOB_SEEKER' as any
      };

      apiServiceMock.login.mockReturnValue(of(mockLoginResponse));

      service.login('test@test.com', 'password').subscribe(res => {
        expect(apiServiceMock.login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password' });
        expect(storageServiceMock.setToken).toHaveBeenCalledWith('access123');
        expect(storageServiceMock.setRefreshToken).toHaveBeenCalledWith('refresh123');
        expect(storageServiceMock.setUserRole).toHaveBeenCalledWith('JOB_SEEKER');
        expect(notificationServiceMock.setUserId).toHaveBeenCalledWith(1);
        expect(service.isAuthenticated()).toBe(true);
      });
    });

    // Boundary value
    it('should handle login where refreshToken is missing (boundary edge case from old backend)', () => {
      service = TestBed.inject(AuthService);
      const mockLoginResponse = {
        accessToken: 'access123',
        userId: 1,
        name: 'Test',
        email: 'test@test.com',
        role: 'JOB_SEEKER' as any
        // refreshToken is intentionally left out
      } as any;

      apiServiceMock.login.mockReturnValue(of(mockLoginResponse));

      service.login('test@test.com', 'password').subscribe(res => {
        expect(storageServiceMock.setToken).toHaveBeenCalledWith('access123');
        expect(storageServiceMock.setRefreshToken).not.toHaveBeenCalled(); // Should not fail, just skip
        expect(service.isAuthenticated()).toBe(true);
      });
    });

    // Exception handling
    it('should catch login error, reset loading state, and re-throw', () => {
      service = TestBed.inject(AuthService);

      apiServiceMock.login.mockReturnValue(throwError(() => new Error('Server Down')));

      service.login('test@test.com', 'badpass').subscribe({
        next: () => { throw new Error('Should not succeed'); },
        error: (err) => {
          expect(err.message).toBe('Server Down');
          expect(service.isAuthenticated()).toBe(false);
        }
      });
    });
  });

  describe('refreshToken()', () => {
    // Normal working
    it('should successfully refresh token if local refresh token exists', () => {
      storageServiceMock.getRefreshToken.mockReturnValue('valid-refresh');
      service = TestBed.inject(AuthService);

      const mockRefreshRes = { accessToken: 'newAccess', refreshToken: 'newRefresh', userId: 1, role: 'ADMIN' as any } as any;
      apiServiceMock.refreshToken.mockReturnValue(of(mockRefreshRes));

      service.refreshToken().subscribe({
        next: (res) => {
          expect(apiServiceMock.refreshToken).toHaveBeenCalledWith('valid-refresh');
          expect(storageServiceMock.setToken).toHaveBeenCalledWith('newAccess');
        }
      });
    });

    // Exception handling / Boundary (Missing prerequisite)
    it('should throw immediately without calling API if no refresh token exists in storage', () => {
      storageServiceMock.getRefreshToken.mockReturnValue(null);
      service = TestBed.inject(AuthService);

      service.refreshToken().subscribe({
        next: () => { throw new Error('Should not call next'); },
        error: (err) => {
          expect(err.message).toBe('No refresh token available');
          expect(apiServiceMock.refreshToken).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe('register(), profile and role helpers', () => {
    it('should set loading false on successful register', () => {
      service = TestBed.inject(AuthService);
      apiServiceMock.register.mockReturnValue(of({ message: 'ok' } as any));
      service.register({} as any).subscribe(() => {
        expect(apiServiceMock.register).toHaveBeenCalled();
      });
    });

    it('should set loading false and propagate register errors', () => {
      service = TestBed.inject(AuthService);
      apiServiceMock.register.mockReturnValue(throwError(() => new Error('register failed')));
      service.register({} as any).subscribe({
        next: () => { throw new Error('should fail'); },
        error: (err) => expect(err.message).toBe('register failed')
      });
    });

    it('should refresh profile and update storage/current user', () => {
      service = TestBed.inject(AuthService);
      const user = { id: 12, name: 'Jane', email: 'jane@x.com', role: 'JOB_SEEKER' } as any;
      apiServiceMock.getProfile.mockReturnValue(of(user));

      service.refreshProfile().subscribe(res => {
        expect(res).toEqual(user);
        expect(storageServiceMock.setUser).toHaveBeenCalledWith(user);
        expect(service.getCurrentUser()).toEqual(user);
      });
    });

    it('should expose role helpers correctly', () => {
      service = TestBed.inject(AuthService);
      storageServiceMock.getUserRole.mockReturnValue('ADMIN');
      expect(service.isAdmin()).toBe(true);
      storageServiceMock.getUserRole.mockReturnValue('RECRUITER');
      expect(service.isRecruiter()).toBe(true);
      storageServiceMock.getUserRole.mockReturnValue('JOB_SEEKER');
      expect(service.isJobSeeker()).toBe(true);
    });

    it('should clear auth and navigate on logout', () => {
      service = TestBed.inject(AuthService);
      service.logout();
      expect(storageServiceMock.clear).toHaveBeenCalled();
      expect(notificationServiceMock.setUserId).toHaveBeenCalledWith(null);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('navigateByRole()', () => {
    // Normal working
    it('should navigate to /admin/dashboard if role is ADMIN', () => {
      storageServiceMock.getUserRole.mockReturnValue('ADMIN');
      service = TestBed.inject(AuthService);

      service.navigateByRole();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });

    // Boundary value
    it('should fallback to /dashboard if role is null/undefined/unknown', () => {
      storageServiceMock.getUserRole.mockReturnValue(null);
      service = TestBed.inject(AuthService);

      service.navigateByRole();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});
