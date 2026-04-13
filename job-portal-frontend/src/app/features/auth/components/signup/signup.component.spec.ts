import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignupComponent } from './signup.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    authServiceMock = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      register: vi.fn()
    };
    
    // ErrorHandlerUtil is mocked at top level

    // ErrorHandlerUtil is mocked at top level

    await TestBed.configureTestingModule({
      imports: [SignupComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(SignupComponent, {
      set: { imports: [ReactiveFormsModule, CommonModule], schemas: ['NO_ERRORS_SCHEMA' as any] } // Mock RouterLink
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization (Normal / Boundary)', () => {
    it('should redirect if user is already authenticated', () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);
      const router = TestBed.inject(Router);
      const navSpy = vi.spyOn(router, 'navigate');
      fixture.detectChanges(); // calls ngOnInit
      
      expect(navSpy).toHaveBeenCalledWith(['/jobs']);
    });

    it('should initialize empty form and default selectedRole if unauthenticated', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);
      fixture.detectChanges();
      
      expect(component.signupForm).toBeDefined();
      expect(component.selectedRole).toBe('JOB_SEEKER');
    });
  });

  describe('Role Selection (Normal working)', () => {
    it('should update selectedRole', () => {
      fixture.detectChanges();
      component.selectRole('RECRUITER');
      expect(component.selectedRole).toBe('RECRUITER');
    });
  });

  describe('Form Submission (Normal working)', () => {
    it('should mark all controls as touched if invalid (boundary short-circuit)', () => {
      fixture.detectChanges();
      const markSpy = vi.spyOn(component.signupForm, 'markAllAsTouched');
      
      component.onSubmit();
      
      expect(markSpy).toHaveBeenCalled();
      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    it('should submit valid payload including active role and route on success', () => {
      fixture.detectChanges();
      authServiceMock.register.mockReturnValue(of({}));
      
      // select role
      component.selectRole('RECRUITER');
      
      // fill valid info
      component.signupForm.setValue({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        phone: '1234567890'
      });
      
      const router = TestBed.inject(Router);
      const navSpy = vi.spyOn(router, 'navigate');
      component.onSubmit();
      
      expect(component.isLoading).toBe(false);
      expect(authServiceMock.register).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'RECRUITER'
      });
      expect(navSpy).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('Exception handling', () => {
    it('should handle API registration errors gracefully via util', () => {
      fixture.detectChanges();
      authServiceMock.register.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      
      component.signupForm.setValue({
        name: 'Test',
        email: 'test@example.com',
        password: 'password',
        phone: '0987654321'
      });
      
      const router = TestBed.inject(Router);
      const navSpy = vi.spyOn(router, 'navigate');
      component.onSubmit();
      
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
      expect(navSpy).not.toHaveBeenCalled();
    });
  });
});
