import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResetPasswordComponent } from './reset-password.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';

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

    vi.spyOn(ErrorHandlerUtil, 'getFriendlyError').mockReturnValue('Reset fallback error');

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: Router, useValue: {} }
      ]
    })
    .overrideComponent(ResetPasswordComponent, {
      set: { imports: [ReactiveFormsModule], schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
    
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
      apiServiceMock.resetPassword.mockReturnValue(throwError(() => new Error('API failure limit')));

      component.resetForm.setValue({
        password: 'password123',
        confirmPassword: 'password123'
      });
      
      component.onSubmit();
      
      expect(ErrorHandlerUtil.getFriendlyError).toHaveBeenCalled();
      expect(component.errorMessage).toBe('Reset fallback error');
      expect(component.isLoading).toBe(false);
    });
  });
});
