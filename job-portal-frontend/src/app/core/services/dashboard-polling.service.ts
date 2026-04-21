import { Injectable, OnDestroy } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { 
  BehaviorSubject, 
  Observable, 
  timer, 
  of, 
  Subscription, 
  fromEvent,
  forkJoin
} from 'rxjs';
import { 
  switchMap, 
  catchError, 
  map, 
  filter, 
  distinctUntilChanged,
  startWith
} from 'rxjs/operators';
import { JobApplicationResponse } from '../../models/application.model';
import { Job } from '../../models/job.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardPollingService implements OnDestroy {
  private readonly POLL_INTERVAL = 30000; // 30 seconds
  
  private isTabVisible$ = fromEvent(document, 'visibilitychange').pipe(
    map(() => document.visibilityState === 'visible'),
    startWith(true),
    distinctUntilChanged()
  );

  private recruiterDataSubject = new BehaviorSubject<{
    jobs: Job[],
    applications: JobApplicationResponse[],
    loading: boolean
  }>({ jobs: [], applications: [], loading: true });

  public recruiterData$ = this.recruiterDataSubject.asObservable();
  private pollingSub?: Subscription;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.initPolling();
  }

  private initPolling(): void {
    this.pollingSub = this.authService.currentUser$.pipe(
      switchMap(user => {
        if (!user || user.role !== 'RECRUITER') {
          return of(null); // Stop polling if not a recruiter
        }
        
        return this.isTabVisible$.pipe(
          switchMap(visible => {
            if (!visible) return of(null); // Pause polling when tab is hidden
            
            return timer(0, this.POLL_INTERVAL).pipe(
              switchMap(() => {
                return this.fetchRecruiterDashboardData(user.id!);
              })
            );
          }),
          filter(data => data !== null)
        );
      })
    ).subscribe({
      next: (data: any) => {
        this.recruiterDataSubject.next({ ...data, loading: false });
      },
      error: (err) => {
        console.error('Dashboard Polling Error:', err);
      }
    });
  }

  private fetchRecruiterDashboardData(userId: number): Observable<{
    jobs: Job[],
    applications: JobApplicationResponse[]
  }> {
    return this.apiService.getJobsByRecruiter(userId).pipe(
      switchMap((res: any) => {
        const jobs: Job[] = res?.content || [];
        if (!jobs || jobs.length === 0) {
          return of({ jobs: [], applications: [] });
        }
        
        const appRequests = jobs.map(job => 
          this.apiService.getJobApplications(job.id).pipe(
            map((pageObj: any) => {
              const apps: JobApplicationResponse[] = pageObj?.content || [];
              return apps.map(app => ({ 
                ...app, 
                jobTitle: job.title, 
                companyName: job.companyName 
              }));
            }),
            catchError(() => of([]))
          )
        );

        return forkJoin(appRequests).pipe(
          map((responses: any[]) => {
            const allApps = responses.reduce((acc: any, curr: any) => [...acc, ...curr], []);
            return { jobs, applications: allApps };
          })
        );
      }),
      catchError(() => {
        const current = this.recruiterDataSubject.value;
        return of({ jobs: current.jobs, applications: current.applications });
      })
    );
  }

  public refresh(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.id && user.role === 'RECRUITER') {
      this.fetchRecruiterDashboardData(user.id).subscribe(data => {
        this.recruiterDataSubject.next({ ...data, loading: false });
      });
    }
  }

  ngOnDestroy(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
  }
}
