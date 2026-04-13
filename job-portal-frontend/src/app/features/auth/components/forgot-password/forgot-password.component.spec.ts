import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';

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

    vi.spyOn(ErrorHandlerUtil, 'getFriendlyError').mockReturnValue('Forgot password error');

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    })
    .overrideComponent(ForgotPasswordComponent, {
      set: { imports: [ReactiveFormsModule], schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
    
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
      apiServiceMock.forgotPassword.mockReturnValue(throwError(() => new Error('Server limit')));
      
      component.forgotForm.setValue({ email: 'test@example.com' });
      component.onSendOtp();
      
      expect(ErrorHandlerUtil.getFriendlyError).toHaveBeenCalled();
      expect(component.errorMessage).toBe('Forgot password error');
      expect(component.showOtpStep).toBe(false);
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

    it('should successfully submit final reset block and route asynchronously', fakeAsync(() => {
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
      expect(routerMock.navigate).not.toHaveBeenCalled();
      tick(2000);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    }));
  });
});
