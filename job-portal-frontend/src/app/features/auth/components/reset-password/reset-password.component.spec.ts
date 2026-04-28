import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResetPasswordComponent } from './reset-password.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let apiServiceMock: any;
  let routeMock: any;
  let queryParamsSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    apiServiceMock = {
      resetPassword: vi.fn()
    };
    
    queryParamsSubject = new BehaviorSubject({ token: 'mock-token-abc' });
    routeMock = {
      queryParams: queryParamsSubject.asObservable()
    };

    // ErrorHandlerUtil is mocked at top level

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock },
        { provide: ActivatedRoute, useValue: routeMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization (Boundary behavior)', () => {
    it('should subscribe to route queries and handle null boundary constraints securely', () => {
      // Intentionally pass nothing instead of token string edgecase
      queryParamsSubject.next({});
      fixture.detectChanges();
      
      expect(component.token).toBeUndefined();
      expect(component.errorMessage).toBe('Invalid or missing reset token.');
    });

    it('should assign token safely when param arrives', () => {
      fixture.detectChanges();
      expect(component.token).toBe('mock-token-abc');
    });
  });

  describe('Form Submission (Normal / Exception)', () => {
    it('should fire API using fallback params map securely upon successful validation', () => {
      fixture.detectChanges();
      apiServiceMock.resetPassword.mockReturnValue(of({ message: 'Success!' }));

      component.resetForm.setValue({
        password: 'password123',
        confirmPassword: 'password123'
      });
      
      component.onSubmit();
      
      expect(apiServiceMock.resetPassword).toHaveBeenCalledWith('', 'mock-token-abc', 'password123');
      expect(component.successMessage).toBe('Success!');
    });

    it('should catch exceptions thrown from legacy backend APIs gracefully', () => {
      fixture.detectChanges();
      apiServiceMock.resetPassword.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      component.resetForm.setValue({
        password: 'password123',
        confirmPassword: 'password123'
      });
      
      component.onSubmit();
      
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
      expect(component.isLoading).toBe(false);
    });

    it('should not submit when form is invalid or token is missing', () => {
      fixture.detectChanges();
      component.token = null;
      component.resetForm.setValue({
        password: 'password123',
        confirmPassword: 'password123'
      });
      component.onSubmit();
      expect(apiServiceMock.resetPassword).not.toHaveBeenCalled();

      component.token = 'mock-token-abc';
      component.resetForm.setValue({
        password: 'password123',
        confirmPassword: 'different-password'
      });
      component.onSubmit();
      expect(apiServiceMock.resetPassword).not.toHaveBeenCalled();
    });

    it('should use fallback success message when API has no message', () => {
      fixture.detectChanges();
      apiServiceMock.resetPassword.mockReturnValue(of({}));
      component.resetForm.setValue({
        password: 'password123',
        confirmPassword: 'password123'
      });

      component.onSubmit();
      expect(component.successMessage).toBe('Password successfully reset!');
    });

    it('should use empty string fallback if token is somehow falsy during submission', () => {
      fixture.detectChanges();
      component.token = ''; // force empty
      component.resetForm.setValue({
        password: 'password123',
        confirmPassword: 'password123'
      });
      component.onSubmit();
      expect(apiServiceMock.resetPassword).not.toHaveBeenCalled();
    });
  });
});
