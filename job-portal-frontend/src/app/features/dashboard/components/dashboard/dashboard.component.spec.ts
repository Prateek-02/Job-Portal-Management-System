import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../../../core/services/auth.service';
import { Router, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';
import { SidebarComponent } from './sidebar/sidebar.component';
import { JobSeekerViewComponent } from './job-seeker-view/job-seeker-view.component';
import { RecruiterViewComponent } from './recruiter-view/recruiter-view.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authServiceMock: any;
  let currentUserSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject(null);
    authServiceMock = {
      currentUser$: currentUserSubject.asObservable(),
      isRecruiter: vi.fn(),
      isJobSeeker: vi.fn(),
      isAdmin: vi.fn()
    };
    
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock }
      ]
    })
    .overrideComponent(DashboardComponent, {
      set: { 
        imports: [SidebarComponent, JobSeekerViewComponent, RecruiterViewComponent], 
        schemas: ['NO_ERRORS_SCHEMA' as any] 
      }
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
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate');
      fixture.detectChanges();
      
      currentUserSubject.next({ id: 1, role: 'RECRUITER' }); // emit mapping normally
      
      expect(component.isRecruiter).toBe(true);
      expect(component.isJobSeeker).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should trigger boundary exceptions rerouting implicitly when detecting ADMIN credentials in standard boundaries limits silently', () => {
      authServiceMock.isAdmin.mockReturnValue(true); // Is Admin
      
      setupComponent();
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate');
      fixture.detectChanges();
      
      currentUserSubject.next({ id: 2, role: 'ADMIN' });
      
      expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });

    it('should handle unauthenticated admin bounds mapping via fallback safely limits natively skipping processing logic silently', () => {
      authServiceMock.isAdmin.mockReturnValue(true); // User is null but Admin state forced via tokens implicitly potentially
      
      setupComponent();
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate');
      fixture.detectChanges(); // user is null
      
      expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });
  });
});
