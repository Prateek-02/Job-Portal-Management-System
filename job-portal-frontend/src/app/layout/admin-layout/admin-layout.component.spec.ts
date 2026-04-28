import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminLayoutComponent } from './admin-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { CacheService } from '../../core/services/cache.service';
import { NotificationService } from '../../core/services/notification.service';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let cacheServiceMock: any;
  let routerMock: any;
  let authServiceMock: any;
  let notificationServiceMock: any;

  beforeEach(async () => {
    cacheServiceMock = { clearAll: vi.fn() };
    routerMock = {
      url: '/admin/settings',
      navigateByUrl: vi.fn().mockResolvedValue(true),
      navigate: vi.fn()
    };
    authServiceMock = { getCurrentUser: vi.fn().mockReturnValue({ id: 1, role: 'ADMIN' }) };
    notificationServiceMock = {};

    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: CacheService, useValue: cacheServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
    
    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Normal working', () => {
    it('should refresh data and reload current router URL', async () => {
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      vi.spyOn(router, 'navigate');
      Object.defineProperty(router, 'url', { value: '/admin/settings' });

      await component.refreshData();
      expect(cacheServiceMock.clearAll).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/', { skipLocationChange: true });
      expect(router.navigate).toHaveBeenCalledWith(['/admin/settings']);
    });

    it('should toggle notification panel state', () => {
      expect(component.isNotificationOpen).toBe(false);
      component.toggleNotifications(new Event('click'));
      expect(component.isNotificationOpen).toBe(true);
    });

    it('should toggle notification panel state without event', () => {
      component.isNotificationOpen = false;
      component.toggleNotifications();
      expect(component.isNotificationOpen).toBe(true);
    });
  });

  describe('Boundary value', () => {
    it('should correctly ignore clicks inside notification boundary', () => {
      component.isNotificationOpen = true;
      const el = document.createElement('div');
      el.classList.add('notification-container');
      document.body.appendChild(el);
      el.click(); // Triggers document click bubbling up
      expect(component.isNotificationOpen).toBe(true); // Should remain open
      document.body.removeChild(el);
    });
  });

  describe('Exception handling', () => {
    it('should safely process orphaned boundary clicks (null wrapper tree)', () => {
      component.isNotificationOpen = true;
      const el = document.createElement('div');
      document.body.appendChild(el);
      
      expect(() => {
        el.click();
      }).not.toThrow();

      expect(component.isNotificationOpen).toBe(false); // Closed gracefully
      document.body.removeChild(el);
    });
  });
});
