import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';

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

    // Spy on the pure utility function to verify exception handling independently
    vi.spyOn(ErrorHandlerUtil, 'getFriendlyError').mockReturnValue('Friendly mock error message');

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: routeMock }
      ]
    })
    .overrideComponent(LoginComponent, {
      set: { imports: [ReactiveFormsModule], schemas: ['NO_ERRORS_SCHEMA' as any] } // Mock RouterLink
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
      expect(component.loginForm).toBeUndefined(); // Did not initialize form
    });

    it('should initialize form with query param returnUrl if not authenticated', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);
      fixture.detectChanges();
      
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('email')).toBeDefined();
      expect((component as any).returnUrl).toBe('/custom-return');
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
      
      component.onSubmit();
      
      expect(component.isLoading).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/dashboard']);

      // Test alternative role path branch
      authServiceMock.getRole.mockReturnValue('JOB_SEEKER');
      component.onSubmit();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('Exception handling', () => {
    it('should handle API login errors gracefully, resetting loading state and rendering message', () => {
      fixture.detectChanges();
      authServiceMock.login.mockReturnValue(throwError(() => new Error('API Error')));
      
      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123'
      });
      
      component.onSubmit();
      
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Friendly mock error message');
      expect(ErrorHandlerUtil.getFriendlyError).toHaveBeenCalled();
    });
  });
});
