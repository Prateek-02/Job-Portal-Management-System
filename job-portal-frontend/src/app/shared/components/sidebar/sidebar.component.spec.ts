import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let authServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      logout: vi.fn(),
      isAdmin: vi.fn().mockReturnValue(true),
    };
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Normal working', () => {
    it('should show logout modal and navigate to login page on execute', () => {
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate');
      
      component.confirmLogout();
      expect(component.showLogoutModal).toBe(true);
      
      component.executeLogout();
      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
      expect(component.showLogoutModal).toBe(false);
    });
  });

  describe('Boundary value', () => {
    it('should handle repeated rapid consecutive clicks (boundary state exhaustion)', () => {
      // Though visually handled by button disabling, code itself should endure rapid clicks
      for (let i = 0; i < 10; i++) {
        component.confirmLogout();
        component.executeLogout();
      }
      expect(authServiceMock.logout).toHaveBeenCalledTimes(10);
    });

    it('should expose route helpers and admin visibility', () => {
      expect(component.getAdminDashboardRoute()).toBe('/admin/dashboard');
      expect(component.getUsersRoute()).toBe('/admin/users');
      expect(component.getJobsRoute()).toBe('/admin/jobs');
      expect(component.getBrowseJobsRoute()).toBe('/jobs');
      expect(component.getConsoleTitle()).toBe('Admin Console');
      expect(component.getConsoleSubtitle()).toBe('System Root');
      expect(component.canShowAdminNav()).toBe(true);
      authServiceMock.isAdmin.mockReturnValue(false);
      expect(component.canShowAdminNav()).toBe(false);
    });
  });

  describe('Exception handling', () => {
    it('should pass unhandled promise rejections properly properly without crashing DOM when router fails', async () => {
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate').mockRejectedValue(new Error('Router failure'));
      
      // Attempting logout shouldn't throw synchronously
      expect(() => {
        component.confirmLogout();
        component.executeLogout();
      }).not.toThrow();
    });
  });
});
