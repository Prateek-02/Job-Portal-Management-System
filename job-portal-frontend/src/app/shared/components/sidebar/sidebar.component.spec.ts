import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { vi } from 'vitest';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    authServiceMock = {
      logout: vi.fn(),
      isAdmin: vi.fn().mockReturnValue(true),
    };
    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Normal working', () => {
    it('should successfully trigger logout sequence and route', () => {
      component.logout();
      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('Boundary value', () => {
    it('should handle repeated rapid consecutive clicks (boundary state exhaustion)', () => {
      // Though visually handled by button disabling, code itself should endure rapid clicks
      for (let i = 0; i < 10; i++) {
        component.logout();
      }
      expect(authServiceMock.logout).toHaveBeenCalledTimes(10);
    });
  });

  describe('Exception handling', () => {
    it('should pass unhandled promise rejections properly without crashing DOM when router fails', async () => {
      // Mock unhandled exception in router
      routerMock.navigate.mockRejectedValue(new Error('Router failure'));
      
      // Attempting logout shouldn't throw synchronously
      expect(() => {
        component.logout();
      }).not.toThrow();
    });
  });
});
