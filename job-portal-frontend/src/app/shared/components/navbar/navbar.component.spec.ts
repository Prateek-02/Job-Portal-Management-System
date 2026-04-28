import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../../core/services/auth.service';
import { CacheService } from '../../../core/services/cache.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { NotificationPanelComponent } from '../../../features/notifications/components/notification-panel/notification-panel.component';
import { provideRouter } from '@angular/router';

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
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: CacheService, useValue: cacheServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock }
      ]
    }).compileComponents();

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
      authServiceMock.isJobSeeker.mockReturnValue(true);
      expect(component.getLogoLink()).toBe('/dashboard');

      authServiceMock.isJobSeeker.mockReturnValue(false);
      expect(component.getLogoLink()).toBe('/');
    });

    it('should refresh data and reload current route', async () => {
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      vi.spyOn(router, 'navigate');
      // Mock url property safely without breaking internal state if possible
      // or just assume it returns something.
      Object.defineProperty(router, 'url', { get: vi.fn(() => '/testz'), configurable: true });

      await component.refreshData();
      
      expect(cacheServiceMock.clearAll).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/', { skipLocationChange: true });
      expect(router.navigate).toHaveBeenCalledWith(['/testz']);
    });
  });

  describe('Boundary value', () => {
    it('should toggle menu and close dropdown explicitly', () => {
      expect(component.isMenuOpen).toBe(false);
      component.toggleMenu();
      expect(component.isMenuOpen).toBe(true);
      component.closeDropdown();
      expect(component.isDropdownOpen).toBe(false);
    });

    it('should handle rapid toggling of dropdowns correctly, ensuring mutual exclusivity', () => {
      component.toggleDropdown(new Event('click'));
      expect(component.isDropdownOpen).toBe(true);
      expect(component.isNotificationOpen).toBe(false);

      // Boundary condition: toggling notifications should close dropdown
      component.toggleNotifications(new Event('click'));
      expect(component.isNotificationOpen).toBe(true);
      expect(component.isDropdownOpen).toBe(false);
    });

    it('should toggle dropdown and notifications without event object', () => {
      component.isNotificationOpen = true;
      component.toggleDropdown();
      expect(component.isDropdownOpen).toBe(true);
      expect(component.isNotificationOpen).toBe(false);

      component.isDropdownOpen = true;
      component.toggleNotifications();
      expect(component.isNotificationOpen).toBe(true);
      expect(component.isDropdownOpen).toBe(false);

      // Toggle off to hit the false branch
      component.isDropdownOpen = true;
      component.toggleDropdown();
      expect(component.isDropdownOpen).toBe(false);
      
      component.isNotificationOpen = true;
      component.toggleNotifications();
      expect(component.isNotificationOpen).toBe(false);
    });
  });

  describe('Exception handling', () => {
    it('should logout and navigate to login page', () => {
      const router = TestBed.inject(Router);
      const navSpy = vi.spyOn(router, 'navigate');
      component.logout();
      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(navSpy).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should update currentUser from auth stream', () => {
      authServiceMock.currentUser$.next({ id: 3, name: 'Jane' });
      expect(component.currentUser).toEqual({ id: 3, name: 'Jane' });
    });

    it('should securely handle document clicks outside modal targets without throwing null pointer', () => {
      component.isDropdownOpen = true;
      component.isNotificationOpen = true;

      const el = document.createElement('div');
      document.body.appendChild(el);

      expect(() => {
        el.click(); // Triggers document.click and bubbles up to hit the HostListener
      }).not.toThrow();

      expect(component.isDropdownOpen).toBe(false);
      expect(component.isNotificationOpen).toBe(false);
      
      document.body.removeChild(el);
    });

    it('should keep panels open when click is inside notification/profile areas', () => {
      component.isDropdownOpen = true;
      component.isNotificationOpen = true;

      const notificationEl = document.createElement('div');
      notificationEl.classList.add('notification-container');
      document.body.appendChild(notificationEl);
      notificationEl.click();
      
      expect(component.isDropdownOpen).toBe(true);
      expect(component.isNotificationOpen).toBe(true);

      const profileEl = document.createElement('div');
      profileEl.classList.add('profile-container');
      document.body.appendChild(profileEl);
      profileEl.click();
      
      expect(component.isDropdownOpen).toBe(true);
      expect(component.isNotificationOpen).toBe(true);

      document.body.removeChild(notificationEl);
      document.body.removeChild(profileEl);
    });

    it('should stop propagation when toggling menus with event', () => {
      const event = { stopPropagation: vi.fn() } as any;
      component.toggleDropdown(event);
      component.toggleNotifications(event);
      expect(event.stopPropagation).toHaveBeenCalledTimes(2);
    });
  });
});
