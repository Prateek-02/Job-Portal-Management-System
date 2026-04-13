import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../../core/services/auth.service';
import { CacheService } from '../../../core/services/cache.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { vi } from 'vitest';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authServiceMock: any;
  let cacheServiceMock: any;
  let notificationServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    authServiceMock = {
      currentUser$: new BehaviorSubject(null),
      isAdmin: vi.fn(),
      isRecruiter: vi.fn(),
      isJobSeeker: vi.fn(),
      logout: vi.fn()
    };

    cacheServiceMock = { clearAll: vi.fn() };
    notificationServiceMock = {};
    routerMock = {
      url: '/testz',
      navigateByUrl: vi.fn().mockResolvedValue(true),
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: CacheService, useValue: cacheServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    })
      .overrideComponent(NavbarComponent, {
        set: { imports: [], schemas: ['NO_ERRORS_SCHEMA' as any] } // Mock standalone child components
      })
      .compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Normal working', () => {
    it('should calculate correct logo link dynamically based on roles', () => {
      authServiceMock.isAdmin.mockReturnValue(true);
      expect(component.getLogoLink()).toBe('/admin/dashboard');

      authServiceMock.isAdmin.mockReturnValue(false);
      authServiceMock.isRecruiter.mockReturnValue(true);
      expect(component.getLogoLink()).toBe('/dashboard');

      authServiceMock.isRecruiter.mockReturnValue(false);
      expect(component.getLogoLink()).toBe('/');
    });

    it('should refresh data and reload current route', async () => {
      await component.refreshData();
      expect(cacheServiceMock.clearAll).toHaveBeenCalled();
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/', { skipLocationChange: true });
      expect(routerMock.navigate).toHaveBeenCalledWith(['/testz']);
    });
  });

  describe('Boundary value', () => {
    it('should handle rapid toggling of dropdowns correctly, ensuring mutual exclusivity', () => {
      component.toggleDropdown(new Event('click'));
      expect(component.isDropdownOpen).toBe(true);
      expect(component.isNotificationOpen).toBe(false);

      // Boundary condition: toggling notifications should close dropdown
      component.toggleNotifications(new Event('click'));
      expect(component.isNotificationOpen).toBe(true);
      expect(component.isDropdownOpen).toBe(false);
    });
  });

  describe('Exception handling', () => {
    it('should securely handle document clicks outside modal targets without throwing null pointer', () => {
      component.isDropdownOpen = true;
      component.isNotificationOpen = true;

      // Mock an element that is totally unattached/null parent tree
      const mockEvent = {
        target: {
          closest: (selector: string) => null // simulate click on body/bg
        }
      } as any;

      expect(() => {
        component.onDocumentClick(mockEvent);
      }).not.toThrow();

      expect(component.isDropdownOpen).toBe(false);
      expect(component.isNotificationOpen).toBe(false);
    });
  });
});
