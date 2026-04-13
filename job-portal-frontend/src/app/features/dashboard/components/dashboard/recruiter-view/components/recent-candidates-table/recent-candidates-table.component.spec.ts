import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RecentCandidatesTableComponent } from './recent-candidates-table.component';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../../../core/services/notification.service';
import { DashboardPollingService } from '../../../../../../../core/services/dashboard-polling.service';
import { ChangeDetectorRef } from '@angular/core';

describe('RecentCandidatesTableComponent', () => {
  let component: RecentCandidatesTableComponent;
  let fixture: ComponentFixture<RecentCandidatesTableComponent>;
  let currentUser$: BehaviorSubject<any>;
  let recruiterData$: BehaviorSubject<any>;
  let notificationServiceMock: any;
  let cdrMock: any;

  beforeEach(async () => {
    currentUser$ = new BehaviorSubject<any>(null);
    recruiterData$ = new BehaviorSubject<any>({});
    notificationServiceMock = { push: vi.fn() };
    cdrMock = { detectChanges: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RecentCandidatesTableComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser$ } },
        { provide: DashboardPollingService, useValue: { recruiterData$ } },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: ChangeDetectorRef, useValue: cdrMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    localStorage.clear();
    fixture = TestBed.createComponent(RecentCandidatesTableComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });

  it('should load recruiter applications, sort, cap to 5, and notify unseen applicants', () => {
    component.ngOnInit();
    currentUser$.next({ id: 4, role: 'RECRUITER' });
    recruiterData$.next({
      applications: [
        { id: 3, applicantName: 'A', jobTitle: 'Dev', jobId: 10 },
        { id: 9, applicantName: 'B', jobTitle: 'QA', jobId: 11 },
        { id: 1, applicantName: 'C', jobTitle: 'SRE', jobId: 12 },
        { id: 7, applicantName: 'D', jobTitle: 'PM', jobId: 13 },
        { id: 5, applicantName: 'E', jobTitle: 'BA', jobId: 14 },
        { id: 2, applicantName: 'F', jobTitle: 'SE', jobId: 15 }
      ]
    });

    expect(component.recentApplicationsForJobs.map(x => x.id)).toEqual([9, 7, 5, 3, 2]);
    expect(notificationServiceMock.push).toHaveBeenCalledTimes(6);
    expect(localStorage.getItem('jp_seen_applicants_4')).toBe(JSON.stringify([3, 9, 1, 7, 5, 2]));
  });

  it('should skip notifications for already seen applicants', () => {
    localStorage.setItem('jp_seen_applicants_4', JSON.stringify([3]));
    component.ngOnInit();
    currentUser$.next({ id: 4, role: 'RECRUITER' });
    recruiterData$.next({ applications: [{ id: 3, applicantName: 'A', jobTitle: 'Dev', jobId: 10 }] });
    expect(notificationServiceMock.push).not.toHaveBeenCalled();
  });

  it('should ignore non-recruiter users', () => {
    component.ngOnInit();
    currentUser$.next({ id: 4, role: 'JOB_SEEKER' });
    recruiterData$.next({ applications: [{ id: 1 }] });
    expect(component.recentApplicationsForJobs).toEqual([]);
  });

  it('should cleanup destroy subject on ngOnDestroy', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');
    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
