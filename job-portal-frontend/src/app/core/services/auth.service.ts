import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { LoginResponse, LoginRequest, RegisterRequest, User, UserRole, RegisterResponse } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<Partial<User> | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const user = this.storageService.getUser();
    const token = this.storageService.getToken();
    if (user && token) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    this.isLoadingSubject.next(true);
    const credentials: LoginRequest = { email, password };
    return this.apiService.login(credentials).pipe(
      tap((response: LoginResponse) => {
        this.handleAuthSuccess(response);
        this.isLoadingSubject.next(false);
      }),
      catchError(error => {
        this.isLoadingSubject.next(false);
        throw error;
      })
    );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    this.isLoadingSubject.next(true);
    return this.apiService.register(userData).pipe(
      tap((response: RegisterResponse) => {
        this.isLoadingSubject.next(false);
      }),
      catchError(error => {
        this.isLoadingSubject.next(false);
        throw error;
      })
    );
  }

  refreshToken(): Observable<LoginResponse> {
    const rToken = this.storageService.getRefreshToken();
    if (!rToken) {
      return throwError(() => new Error("No refresh token available"));
    }
    return this.apiService.refreshToken(rToken).pipe(
      tap((response: LoginResponse) => {
        this.handleAuthSuccess(response);
      })
    );
  }

  private handleAuthSuccess(response: LoginResponse): void {
    if (response && response.accessToken) {
      this.storageService.setToken(response.accessToken);
      
      if (response.refreshToken) {
        this.storageService.setRefreshToken(response.refreshToken);
      }
      
      const user = {
        id: response.userId,
        name: response.name,
        email: response.email,
        role: response.role
      };
      this.storageService.setUser(user);
      this.storageService.setUserRole(response.role);
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  private clearAuth(): void {
    this.storageService.clear();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  refreshProfile(): Observable<User> {
    return this.apiService.getProfile().pipe(
      tap(user => {
        this.storageService.setUser(user);
        this.currentUserSubject.next(user);
      })
    );
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getCurrentUser(): Partial<User> | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.storageService.getToken();
  }

  getRole(): UserRole | null {
    return this.storageService.getUserRole() as UserRole | null;
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isRecruiter(): boolean {
    return this.getRole() === 'RECRUITER';
  }

  isJobSeeker(): boolean {
    return this.getRole() === 'JOB_SEEKER';
  }

  navigateByRole(): void {
    const role = this.getRole();
    if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
