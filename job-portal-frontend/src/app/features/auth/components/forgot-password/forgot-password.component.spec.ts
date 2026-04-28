import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let apiServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    apiServiceMock = {
      forgotPassword: vi.fn(),
      resetPassword: vi.fn()
    };
    
    routerMock = {
      navigate: vi.fn()
    };

    // ErrorHandlerUtil is mocked at top level

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('OTP Request Phase (Normal / Exception)', () => {
    it('should submit forgot password email and reveal OTP step natively', () => {
      apiServiceMock.forgotPassword.mockReturnValue(of({ message: 'OTP sent!' }));
      
      component.forgotForm.setValue({ email: 'test@example.com' });
      component.onSendOtp();
      
      expect(apiServiceMock.forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(component.showOtpStep).toBe(true);
      expect(component.successMessage).toBe('OTP sent to your email!');
    });

    it('should catch unhandled exceptions when API throws 500 on request', () => {
      apiServiceMock.forgotPassword.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      
      component.forgotForm.setValue({ email: 'test@example.com' });
      component.onSendOtp();
      
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
      expect(component.showOtpStep).toBe(false);
    });

    it('should not call forgotPassword when email form is invalid', () => {
      component.forgotForm.setValue({ email: '' });
      component.onSendOtp();
      expect(apiServiceMock.forgotPassword).not.toHaveBeenCalled();
    });
  });

  describe('Reset Password Phase (Normal / Boundary)', () => {
    it('should handle boundary validation restrictions on passwords', () => {
      // Mismatched passwords boundary
      component.resetForm.setValue({
        otp: '123456',
        newPassword: 'password123',
        confirmPassword: 'different123' // mismatch edge
      });
      
      expect(component.resetForm.valid).toBe(false);
      expect(component.resetForm.hasError('mismatch')).toBe(true);
      
      // Attempting sumbit does not fire API
      component.onResetPassword();
      expect(apiServiceMock.resetPassword).not.toHaveBeenCalled();
    });

    it('should successfully submit final reset block and route asynchronously', async () => {
      vi.useFakeTimers();
      apiServiceMock.resetPassword.mockReturnValue(of({ message: 'Success' }));
      
      // Initial mock states
      component.forgotForm.setValue({ email: 'test@example.com' });
      component.resetForm.setValue({
        otp: '123456',
        newPassword: 'password123',
        confirmPassword: 'password123'
      });
      
      component.onResetPassword();
      
      expect(apiServiceMock.resetPassword).toHaveBeenCalledWith('test@example.com', '123456', 'password123');
      expect(component.successMessage).toBe('Success');
      
      // Test the timeout boundary logic routing wrapper
      const router = TestBed.inject(Router);
      const navSpy = vi.spyOn(router, 'navigate');
      expect(navSpy).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(2000);
      expect(navSpy).toHaveBeenCalledWith(['/auth/login']);
      vi.useRealTimers();
    });

    it('should fallback reset success message and handle API errors', () => {
      apiServiceMock.resetPassword.mockReturnValue(of({}));
      component.forgotForm.setValue({ email: 'test@example.com' });
      component.resetForm.setValue({
        otp: '123456',
        newPassword: 'password123',
        confirmPassword: 'password123'
      });
      component.onResetPassword();
      expect(component.successMessage).toBe('Password reset successfully!');

      apiServiceMock.resetPassword.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
      component.onResetPassword();
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage.length).toBeGreaterThan(0);
    });
  });
});
