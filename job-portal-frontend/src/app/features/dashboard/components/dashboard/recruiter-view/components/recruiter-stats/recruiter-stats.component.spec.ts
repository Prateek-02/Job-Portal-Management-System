import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecruiterStatsComponent } from './recruiter-stats.component';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { DashboardPollingService } from '../../../../../../../core/services/dashboard-polling.service';

describe('RecruiterStatsComponent', () => {
  let component: RecruiterStatsComponent;
  let fixture: ComponentFixture<RecruiterStatsComponent>;
  let currentUser$: BehaviorSubject<any>;
  let recruiterData$: BehaviorSubject<any>;

  beforeEach(async () => {
    currentUser$ = new BehaviorSubject<any>(null);
    recruiterData$ = new BehaviorSubject<any>({});
    await TestBed.configureTestingModule({
      imports: [RecruiterStatsComponent],
      providers: [
        { provide: AuthService, useValue: { currentUser$ } },
        { provide: DashboardPollingService, useValue: { recruiterData$ } }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecruiterStatsComponent);
    component = fixture.componentInstance;
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe and compute recruiter metrics', () => {
    component.ngOnInit();
    const today = new Date().toISOString();
    currentUser$.next({ id: 10, role: 'RECRUITER' });
    recruiterData$.next({
      jobs: [{ id: 1 }, { id: 2 }],
      applications: [
        { id: 1, status: 'APPLIED', appliedAt: today },
        { id: 2, status: 'UNDER_REVIEW', appliedAt: today },
        { id: 3, status: 'SHORTLISTED', appliedAt: today }
      ]
    });

    expect(component.myPostedJobs.length).toBe(2);
    expect(component.recentApplicationsForJobs.length).toBe(3);
    expect(component.pendingApplications.length).toBe(2);
    expect(component.interviewCount).toBe(1);
    expect(component.totalAppsLast7Days).toBeGreaterThan(0);
    expect(component.appVelocityPoints).toContain(',');
  });

  it('should ignore non-recruiter users and missing data payload', () => {
    component.ngOnInit();
    currentUser$.next({ id: 10, role: 'JOB_SEEKER' });
    recruiterData$.next({ jobs: [{ id: 1 }] });
    expect(component.myPostedJobs).toEqual([]);
    expect(component.pendingApplications).toEqual([]);
  });

  it('should clean up subscriptions on destroy', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');
    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
