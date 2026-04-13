import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;
  let routerMock: any;
  let routeMock: any;

  beforeEach(async () => {
    authServiceMock = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      navigateByRole: vi.fn(),
      login: vi.fn(),
      getRole: vi.fn()
    };
    
    routerMock = {
      navigate: vi.fn()
    };
    
    routeMock = {
      snapshot: { queryParams: { returnUrl: '/custom-return' } }
    };

    // ErrorHandlerUtil is mocked at top level

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ActivatedRoute, useValue: routeMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(LoginComponent, {
      set: { imports: [ReactiveFormsModule, CommonModule], schemas: ['NO_ERRORS_SCHEMA' as any] } // Mock RouterLink
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization (Normal working / Boundary)', () => {
    it('should redirect if user is already authenticated without rendering', () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);
      fixture.detectChanges(); // calls ngOnInit
      
      expect(authServiceMock.navigateByRole).toHaveBeenCalled();
    });

    it('should initialize form with query param returnUrl if not authenticated', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);
      fixture.detectChanges();
      
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('email')).toBeDefined();
      expect((component as any).returnUrl).toBe('/custom-return');
    });

    it('should fallback to /dashboard when returnUrl query is missing', () => {
      routeMock.snapshot.queryParams = {};
      fixture.detectChanges();
      expect((component as any).returnUrl).toBe('/dashboard');
    });
  });

  describe('Form Submission (Normal working)', () => {
    it('should mark all controls as touched if form is invalid (boundary prevention)', () => {
      fixture.detectChanges();
      const markSpy = vi.spyOn(component.loginForm, 'markAllAsTouched');
      
      component.onSubmit();
      
      expect(markSpy).toHaveBeenCalled();
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should successfully submit valid form and route based on role', () => {
      fixture.detectChanges();
      authServiceMock.login.mockReturnValue(of({}));
      authServiceMock.getRole.mockReturnValue('ADMIN');
      
      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123'
      });
      
      const router = TestBed.inject(Router);
      const navSpy = vi.spyOn(router, 'navigate');
      component.onSubmit();
      
      expect(component.isLoading).toBe(false);
      expect(navSpy).toHaveBeenCalledWith(['/admin/dashboard']);

      // Test alternative role path branch
      authServiceMock.getRole.mockReturnValue('JOB_SEEKER');
      component.onSubmit();
      expect(navSpy).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('Exception handling', () => {
    it('should handle API login errors gracefully, resetting loading state and rendering message', () => {
      fixture.detectChanges();
      authServiceMock.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      
      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123'
      });
      
      component.onSubmit();
      
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
    });
  });
});
