import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private storageService: StorageService
  ) {
    this.initializeAuth();
  }

  // Initialize authentication state from storage
  private initializeAuth(): void {
    const user = this.storageService.getUser();
    const token = this.storageService.getToken();
    if (user && token) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  // Login user
  login(email: string, password: string): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.apiService.login({ email, password }).pipe(
      tap(response => {
        if (response && response.token && response.user) {
          this.storageService.setToken(response.token);
          this.storageService.setUser(response.user);
          this.storageService.setUserRole(response.user.role);
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        }
        this.isLoadingSubject.next(false);
      }),
      catchError(error => {
        this.isLoadingSubject.next(false);
        throw error;
      })
    );
  }

  // Register new user
  signup(userData: any): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.apiService.signup(userData).pipe(
      tap(response => {
        if (response && response.token && response.user) {
          this.storageService.setToken(response.token);
          this.storageService.setUser(response.user);
          this.storageService.setUserRole(response.user.role);
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        }
        this.isLoadingSubject.next(false);
      }),
      catchError(error => {
        this.isLoadingSubject.next(false);
        throw error;
      })
    );
  }

  // Logout user
  logout(): void {
    this.apiService.logout().subscribe({
      next: () => this.clearAuth(),
      error: () => this.clearAuth()
    });
  }

  // Clear authentication
  private clearAuth(): void {
    this.storageService.clear();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  // Reset password
  resetPassword(email: string): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.apiService.resetPassword(email).pipe(
      tap(() => this.isLoadingSubject.next(false)),
      catchError(error => {
        this.isLoadingSubject.next(false);
        throw error;
      })
    );
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // Get current user
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  // Get auth token
  getToken(): string | null {
    return this.storageService.getToken();
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  // Check if user is recruiter
  isRecruiter(): boolean {
    return this.hasRole('RECRUITER');
  }

  // Refresh user profile from backend
  refreshProfile(): Observable<any> {
    return this.apiService.getProfile().pipe(
      tap(user => {
        this.storageService.setUser(user);
        this.currentUserSubject.next(user);
      })
    );
  }
}
