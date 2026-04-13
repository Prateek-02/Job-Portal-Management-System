import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminLayoutComponent } from './admin-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { CacheService } from '../../core/services/cache.service';
import { NotificationService } from '../../core/services/notification.service';
import { Router } from '@angular/router';
import { vi } from 'vitest';

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
    authServiceMock = {};
    notificationServiceMock = {};

    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        { provide: CacheService, useValue: cacheServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
        // Use string provide if path mapping is weird in source, but class injection is used in constructor.
        // Assuming TS resolves it in TestBed safely via mock:
        { provide: NotificationService, useValue: notificationServiceMock }
      ]
    })
    .overrideComponent(AdminLayoutComponent, {
      set: { imports: [], schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Normal working', () => {
    it('should refresh data and reload current router URL', async () => {
      await component.refreshData();
      expect(cacheServiceMock.clearAll).toHaveBeenCalled();
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/', { skipLocationChange: true });
      expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/settings']);
    });

    it('should toggle notification panel state', () => {
      expect(component.isNotificationOpen).toBe(false);
      component.toggleNotifications(new Event('click'));
      expect(component.isNotificationOpen).toBe(true);
    });
  });

  describe('Boundary value', () => {
    it('should correctly ignore clicks inside notification boundary', () => {
      component.isNotificationOpen = true;
      const mockEvent = {
        target: {
          closest: (selector: string) => selector === '.notification-container' ? true : null
        }
      } as any;

      component.onDocumentClick(mockEvent);
      expect(component.isNotificationOpen).toBe(true); // Should remain open
    });
  });

  describe('Exception handling', () => {
    it('should safely process orphaned boundary clicks (null wrapper tree)', () => {
      component.isNotificationOpen = true;
      const mockEvent = {
        target: {
          closest: () => null // completely outside
        }
      } as any;

      expect(() => {
        component.onDocumentClick(mockEvent);
      }).not.toThrow();

      expect(component.isNotificationOpen).toBe(false); // Closed gracefully
    });
  });
});
