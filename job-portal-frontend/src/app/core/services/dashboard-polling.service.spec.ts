import { TestBed } from '@angular/core/testing';
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
    it('should fetch jobs and their applications on forced refresh() if role is RECRUITER', async () => {
      vi.useFakeTimers();
      authServiceMock.getCurrentUser.mockReturnValue({ id: 99, role: 'RECRUITER' });
      const jobsRes: any = { content: [{ id: 1, title: 'Job A', companyName: 'XYZ' }] };
      const appsRes: any = { content: [{ id: 101, applicantName: 'John Doe' }] };
      
      apiServiceMock.getJobsByRecruiter.mockReturnValue(of(jobsRes));
      apiServiceMock.getJobApplications.mockReturnValue(of(appsRes));
 
      service = TestBed.inject(DashboardPollingService);
      service.refresh();
      
      // Flush microtasks and timers
      await Promise.resolve();
      vi.runAllTicks();
 
      let dataCheck: any;
      service.recruiterData$.subscribe(data => dataCheck = data);
 
      expect(dataCheck.loading).toBe(false);
      expect(dataCheck.jobs.length).toBe(1);
      expect(dataCheck.applications.length).toBe(1);
      expect(dataCheck.applications[0].jobTitle).toBe('Job A'); // mapped property
      
      vi.useRealTimers();
    });

    // Boundary value
    it('should NOT attempt to fetch if user is not RECRUITER (e.g. JOB_SEEKER boundary)', async () => {
      vi.useFakeTimers();
      authServiceMock.getCurrentUser.mockReturnValue({ id: 99, role: 'JOB_SEEKER' });
      service = TestBed.inject(DashboardPollingService);
      
      service.refresh();
      await Promise.resolve();
      vi.runAllTicks();
 
      expect(apiServiceMock.getJobsByRecruiter).not.toHaveBeenCalled();
      
      vi.useRealTimers();
    });
    
    // Boundary value (Zero jobs)
    it('should handle zero jobs gracefully without calling applications API', async () => {
      vi.useFakeTimers();
      authServiceMock.getCurrentUser.mockReturnValue({ id: 99, role: 'RECRUITER' });
      apiServiceMock.getJobsByRecruiter.mockReturnValue(of({ content: [] } as any));
      
      service = TestBed.inject(DashboardPollingService);
      service.refresh();
      await Promise.resolve();
      vi.runAllTicks();
 
      expect(apiServiceMock.getJobsByRecruiter).toHaveBeenCalled();
      expect(apiServiceMock.getJobApplications).not.toHaveBeenCalled(); // Fast exit boundary
      
      let dataCheck: any;
      service.recruiterData$.subscribe(d => dataCheck = d);
      expect(dataCheck.jobs).toEqual([]);
      expect(dataCheck.applications).toEqual([]);
      
      vi.useRealTimers();
    });

    // Exception handling
    it('should handle individual job application API failure without failing whole fetch', async () => {
      vi.useFakeTimers();
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
      await Promise.resolve();
      vi.runAllTicks();
 
      let dataCheck: any;
      service.recruiterData$.subscribe(d => dataCheck = d);
      
      // Should still resolve Job A's application, Job B's failure ignored (catchError => of([]))
      expect(dataCheck.applications.length).toBe(1);
      
      vi.useRealTimers();
    });

    it('should keep previous recruiter data when jobs API fails', async () => {
      authServiceMock.getCurrentUser.mockReturnValue({ id: 99, role: 'RECRUITER' });
      service = TestBed.inject(DashboardPollingService);

      (service as any).recruiterDataSubject.next({
        jobs: [{ id: 1 } as any],
        applications: [{ id: 2 } as any],
        loading: false
      });
      apiServiceMock.getJobsByRecruiter.mockReturnValue(throwError(() => new Error('down')));

      service.refresh();
      await Promise.resolve();

      let dataCheck: any;
      service.recruiterData$.subscribe(d => dataCheck = d);
      expect(dataCheck.jobs.length).toBe(1);
      expect(dataCheck.applications.length).toBe(1);
      expect(dataCheck.loading).toBe(false);
    });

    it('should not refresh when current user is null', () => {
      authServiceMock.getCurrentUser.mockReturnValue(null);
      service = TestBed.inject(DashboardPollingService);
      service.refresh();
      expect(apiServiceMock.getJobsByRecruiter).not.toHaveBeenCalled();
    });

    it('should unsubscribe polling subscription on destroy', () => {
      service = TestBed.inject(DashboardPollingService);
      const unsubSpy = vi.spyOn((service as any).pollingSub, 'unsubscribe');
      service.ngOnDestroy();
      expect(unsubSpy).toHaveBeenCalled();
    });

    it('should run init polling flow for visible and hidden tab states', async () => {
      vi.useFakeTimers();
      apiServiceMock.getJobsByRecruiter.mockReturnValue(of({ content: [{ id: 1, title: 'J1', companyName: 'C1' }] }));
      apiServiceMock.getJobApplications.mockReturnValue(of({ content: [{ id: 12, status: 'APPLIED' }] }));
      service = TestBed.inject(DashboardPollingService);

      currentUserSubject.next({ id: 5, role: 'RECRUITER' });
      vi.advanceTimersByTime(0);
      await Promise.resolve();

      let state: any;
      service.recruiterData$.subscribe(d => state = d);
      expect(state.loading).toBe(false);
      expect(state.jobs.length).toBe(1);

      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(31000);
      await Promise.resolve();
      expect(apiServiceMock.getJobsByRecruiter).toHaveBeenCalledTimes(1);

      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(0);
      await Promise.resolve();
      expect(apiServiceMock.getJobsByRecruiter).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });

    it('should log polling stream errors from auth stream', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      service = TestBed.inject(DashboardPollingService);
      currentUserSubject.error(new Error('auth stream failed'));
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
