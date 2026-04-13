import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignupComponent } from './signup.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';

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
    
    routerMock = {
      navigate: vi.fn()
    };

    vi.spyOn(ErrorHandlerUtil, 'getFriendlyError').mockReturnValue('Signup mock error');

    await TestBed.configureTestingModule({
      imports: [SignupComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    })
    .overrideComponent(SignupComponent, {
      set: { imports: [ReactiveFormsModule], schemas: ['NO_ERRORS_SCHEMA' as any] } // Mock RouterLink
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization (Normal / Boundary)', () => {
    it('should redirect if user is already authenticated', () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);
      fixture.detectChanges(); // calls ngOnInit
      
      expect(routerMock.navigate).toHaveBeenCalledWith(['/jobs']);
      expect(component.signupForm).toBeUndefined(); // Form not initialized
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
      
      component.onSubmit();
      
      expect(component.isLoading).toBe(false);
      expect(authServiceMock.register).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'RECRUITER'
      });
      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('Exception handling', () => {
    it('should handle API registration errors gracefully via util', () => {
      fixture.detectChanges();
      authServiceMock.register.mockReturnValue(throwError(() => new Error('Registration failed')));
      
      component.signupForm.setValue({
        name: 'Test',
        email: 'test@example.com',
        password: 'password',
        phone: '0987654321'
      });
      
      component.onSubmit();
      
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Signup mock error');
      expect(ErrorHandlerUtil.getFriendlyError).toHaveBeenCalled();
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });
});
