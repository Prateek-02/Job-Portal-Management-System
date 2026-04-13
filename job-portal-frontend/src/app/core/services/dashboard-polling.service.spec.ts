import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { DashboardPollingService } from './dashboard-polling.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('DashboardPollingService', () => {
  let service: DashboardPollingService;
  let apiServiceMock: any;
  let authServiceMock: any;
  let currentUserSubject: BehaviorSubject<any>;

  beforeEach(() => {
    apiServiceMock = {
      getJobsByRecruiter: vi.fn(),
      getJobApplications: vi.fn()
    };
    
    authServiceMock = {
      getCurrentUser: vi.fn()
    };
    
    currentUserSubject = new BehaviorSubject(null);
    (authServiceMock as any).currentUser$ = currentUserSubject.asObservable();

    TestBed.configureTestingModule({
      providers: [
        DashboardPollingService,
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    });
  });

  describe('Initialization and refresh()', () => {
    // Normal working
    it('should fetch jobs and their applications on forced refresh() if role is RECRUITER', (done) => {
      authServiceMock.getCurrentUser.mockReturnValue({ id: 99, role: 'RECRUITER' });
      const jobsRes: any = { content: [{ id: 1, title: 'Job A', companyName: 'XYZ' }] };
      const appsRes: any = { content: [{ id: 101, applicantName: 'John Doe' }] };
      
      apiServiceMock.getJobsByRecruiter.mockReturnValue(of(jobsRes));
      apiServiceMock.getJobApplications.mockReturnValue(of(appsRes));

      service = TestBed.inject(DashboardPollingService);
      service.refresh();

      // Give it a tick to process observable chain
      setTimeout(() => {
        service.recruiterData$.subscribe(data => {
          expect(data.loading).toBe(false);
          expect(data.jobs.length).toBe(1);
          expect(data.applications.length).toBe(1);
          expect(data.applications[0].jobTitle).toBe('Job A'); // mapped property
          done();
        });
      }, 0);
    });

    // Boundary value
    it('should NOT attempt to fetch if user is not RECRUITER (e.g. JOB_SEEKER boundary)', fakeAsync(() => {
      authServiceMock.getCurrentUser.mockReturnValue({ id: 99, role: 'JOB_SEEKER' });
      service = TestBed.inject(DashboardPollingService);
      
      service.refresh();
      tick();

      expect(apiServiceMock.getJobsByRecruiter).not.toHaveBeenCalled();
      
      discardPeriodicTasks();
    }));
    
    // Boundary value (Zero jobs)
    it('should handle zero jobs gracefully without calling applications API', fakeAsync(() => {
      authServiceMock.getCurrentUser.mockReturnValue({ id: 99, role: 'RECRUITER' });
      apiServiceMock.getJobsByRecruiter.mockReturnValue(of({ content: [] } as any));
      
      service = TestBed.inject(DashboardPollingService);
      service.refresh();
      tick();

      expect(apiServiceMock.getJobsByRecruiter).toHaveBeenCalled();
      expect(apiServiceMock.getJobApplications).not.toHaveBeenCalled(); // Fast exit boundary
      
      let dataCheck: any;
      service.recruiterData$.subscribe(d => dataCheck = d);
      expect(dataCheck.jobs).toEqual([]);
      expect(dataCheck.applications).toEqual([]);
      
      discardPeriodicTasks();
    }));

    // Exception handling
    it('should handle individual job application API failure without failing whole fetch', fakeAsync(() => {
      authServiceMock.getCurrentUser.mockReturnValue({ id: 99, role: 'RECRUITER' });
      
      const jobsRes: any = { content: [
        { id: 1, title: 'Job A' }, 
        { id: 2, title: 'Job B' }
      ]};
      
      apiServiceMock.getJobsByRecruiter.mockReturnValue(of(jobsRes));
      
      // Job 1 success, Job 2 fails
      apiServiceMock.getJobApplications.mockImplementation((jobId: number) => {
        if (jobId === 1) return of({ content: [{ id: 10 }] } as any);
        if (jobId === 2) return throwError(() => new Error('API failed'));
        return of({} as any);
      });

      service = TestBed.inject(DashboardPollingService);
      service.refresh();
      tick();

      let dataCheck: any;
      service.recruiterData$.subscribe(d => dataCheck = d);
      
      // Should still resolve Job A's application, Job B's failure ignored (catchError => of([]))
      expect(dataCheck.applications.length).toBe(1);
      
      discardPeriodicTasks();
    }));
  });
});
