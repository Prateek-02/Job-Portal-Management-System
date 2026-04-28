import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, provideRouter } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let apiServiceMock: any;
  let authServiceMock: any;
  let notificationServiceMock: any;

  beforeEach(async () => {
    apiServiceMock = {
      getAdminReports: vi.fn(),
      getAdminUsers: vi.fn().mockReturnValue(of({ content: [] }))
    };
    
    authServiceMock = {
      getCurrentUser: vi.fn().mockReturnValue({ id: 1, role: 'ADMIN' })
    };

    notificationServiceMock = {
      push: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    localStorage.removeItem('jp_seen_users_1');
  });

  describe('Lifecycle and Data Init (Normal / Exception)', () => {
    it('should perfectly map structural metrics reporting safely natively', () => {
      apiServiceMock.getAdminReports.mockReturnValue(of({ totalUsers: 100, activeJobs: 50 }));
      setupComponent();
      fixture.detectChanges();
      
      expect(apiServiceMock.getAdminReports).toHaveBeenCalled();
      expect(component.reports?.totalUsers).toBe(100);
      expect(component.isLoading).toBe(false);
    });

    it('should gracefully degrade on API throwing securely mapping bound limits', () => {
      apiServiceMock.getAdminReports.mockReturnValue(throwError(() => new Error('Dead')));
      setupComponent();
      fixture.detectChanges();
      
      expect(component.isLoading).toBe(false);
      expect(component.reports).toBeNull();
    });
  });

  describe('User Monitoring Strategy (Boundary)', () => {
    it('should gracefully bypass checking flows entirely if auth bounds return physically unauthenticated streams', () => {
      authServiceMock.getCurrentUser.mockReturnValue(null);
      apiServiceMock.getAdminReports.mockReturnValue(of({}));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(apiServiceMock.getAdminUsers).not.toHaveBeenCalled();
    });

    it('should establish original localStorage arrays cleanly without artificially triggering notifications initially', () => {
      localStorage.removeItem('jp_seen_users_1');
      apiServiceMock.getAdminReports.mockReturnValue(of({}));
      apiServiceMock.getAdminUsers.mockReturnValue(of({ content: [{ id: 101, name: 'T1' }, { id: 102, name: 'T2' }] }));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(notificationServiceMock.push).toHaveBeenCalledTimes(1);
      
      const stored = JSON.parse(localStorage.getItem('jp_seen_users_1')!);
      expect(stored).toEqual([101, 102]);
    });

    it('should invoke notifications consecutively for purely delta incoming user additions sequentially structurally', () => {
      apiServiceMock.getAdminReports.mockReturnValue(of({}));
      apiServiceMock.getAdminUsers.mockReturnValue(of({ content: [{ id: 101, name: 'T1' }, { id: 102, name: 'T2', role: 'RECRUITER' }] }));
      
      // Simulate existing cache mapping (101 already seen)
      localStorage.setItem('jp_seen_users_1', JSON.stringify([101]));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(notificationServiceMock.push).toHaveBeenCalledTimes(1);
      expect(notificationServiceMock.push).toHaveBeenCalledWith(
        'USER_REGISTERED',
        'New User Registered',
        'T2 (RECRUITER) has just joined the platform.',
        '/admin/users'
      );
      
      const stored = JSON.parse(localStorage.getItem('jp_seen_users_1')!);
      expect(stored).toEqual([101, 102]); // Merged
    });

    it('should handle null content response gracefully in user monitoring', () => {
      apiServiceMock.getAdminReports.mockReturnValue(of({}));
      apiServiceMock.getAdminUsers.mockReturnValue(of(null));
      
      setupComponent();
      fixture.detectChanges();
      
      const stored = localStorage.getItem('jp_seen_users_1');
      expect(stored).toBeNull();
    });
  });
});
