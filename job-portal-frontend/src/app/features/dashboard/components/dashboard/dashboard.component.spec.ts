import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authServiceMock: any;
  let routerMock: any;
  let currentUserSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject(null);
    authServiceMock = {
      currentUser$: currentUserSubject.asObservable(),
      isRecruiter: vi.fn(),
      isJobSeeker: vi.fn(),
      isAdmin: vi.fn()
    };
    
    routerMock = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    })
    .overrideComponent(DashboardComponent, {
      set: { imports: [], schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  }

  describe('User Role Resolution (Normal / Exception / Boundary)', () => {
    it('should assign local flags identically mapping observables via explicit tracking securely', () => {
      authServiceMock.isRecruiter.mockReturnValue(true);
      authServiceMock.isJobSeeker.mockReturnValue(false);
      authServiceMock.isAdmin.mockReturnValue(false);
      
      setupComponent();
      fixture.detectChanges();
      
      currentUserSubject.next({ id: 1, role: 'RECRUITER' }); // emit mapping normally
      
      expect(component.isRecruiter).toBe(true);
      expect(component.isJobSeeker).toBe(false);
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should trigger boundary exceptions rerouting implicitly when detecting ADMIN credentials in standard boundaries limits silently', () => {
      authServiceMock.isAdmin.mockReturnValue(true); // Is Admin
      
      setupComponent();
      fixture.detectChanges();
      
      currentUserSubject.next({ id: 2, role: 'ADMIN' });
      
      expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });

    it('should handle unauthenticated admin bounds mapping via fallback safely limits natively skipping processing logic silently', () => {
      authServiceMock.isAdmin.mockReturnValue(true); // User is null but Admin state forced via tokens implicitly potentially
      
      setupComponent();
      fixture.detectChanges(); // user is null
      
      expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });
  });
});
