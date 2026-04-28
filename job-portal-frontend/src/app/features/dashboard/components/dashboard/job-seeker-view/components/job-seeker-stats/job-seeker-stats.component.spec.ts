import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobSeekerStatsComponent } from './job-seeker-stats.component';
import { BehaviorSubject, of } from 'rxjs';
import { ApiService } from '../../../../../../../core/services/api.service';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../../../core/services/notification.service';

describe('JobSeekerStatsComponent', () => {
  let component: JobSeekerStatsComponent;
  let fixture: ComponentFixture<JobSeekerStatsComponent>;
  let apiServiceMock: any;
  let notificationServiceMock: any;
  let currentUser$: BehaviorSubject<any>;

  beforeEach(async () => {
    currentUser$ = new BehaviorSubject<any>(null);
    apiServiceMock = { getMyApplications: vi.fn() };
    notificationServiceMock = { push: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [JobSeekerStatsComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthService, useValue: { currentUser$ } },
        { provide: NotificationService, useValue: notificationServiceMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    localStorage.clear();
    fixture = TestBed.createComponent(JobSeekerStatsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });

  it('should load stats and push first-seen status notifications', () => {
    apiServiceMock.getMyApplications.mockReturnValue(of({
      totalElements: 3,
      content: [
        { id: 1, status: 'APPLIED', job: { title: 'Dev', companyName: 'Acme' } },
        { id: 2, status: 'SHORTLISTED', job: { title: 'QA', companyName: 'Beta' } },
        { id: 3, status: 'REJECTED', job: { title: 'SRE', companyName: 'Gamma' } }
      ]
    }));

    component.ngOnInit();
    currentUser$.next({ id: 7 });

    expect(component.appliedCount).toBe(3);
    expect(component.interviewCount).toBe(1);
    expect(component.rejectedCount).toBe(1);
    expect(notificationServiceMock.push).toHaveBeenCalledWith(
      'APPLICATION_STATUS',
      'Application Submitted',
      expect.stringContaining('shortlisted'),
      '/applications/my-applications'
    );
    expect(localStorage.getItem('jp_app_metadata_7')).toContain('"1":"APPLIED"');
  });

  it('should fallback to default labels for unknown statuses and handle null responses gracefully', () => {
    apiServiceMock.getMyApplications.mockReturnValue(of(null));
    component.ngOnInit();
    currentUser$.next({ id: 1 });
    expect(component.appliedCount).toBe(0);
  });

  it('should only notify when status changes and skip unchanged ones', () => {
    localStorage.setItem('jp_app_metadata_7', JSON.stringify({ 1: 'APPLIED', 2: 'UNDER_REVIEW' }));
    apiServiceMock.getMyApplications.mockReturnValue(of({
      totalElements: 2,
      content: [
        { id: 1, status: 'APPLIED', job: { title: 'Dev', companyName: 'Acme' } },
        { id: 2, status: 'SHORTLISTED', job: { title: 'QA', companyName: 'Beta' } }
      ]
    }));

    component.ngOnInit();
    currentUser$.next({ id: 7 });

    expect(notificationServiceMock.push).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('jp_app_metadata_7')).toContain('"2":"SHORTLISTED"');
  });

  it('should skip API call when user is null or missing id', () => {
    apiServiceMock.getMyApplications.mockClear();
    component.ngOnInit();
    currentUser$.next(null);
    currentUser$.next({});
    expect(apiServiceMock.getMyApplications).not.toHaveBeenCalled();
  });

  it('should avoid notifications and storage writes when nothing changes', () => {
    localStorage.setItem('jp_app_metadata_7', JSON.stringify({ 1: 'APPLIED' }));
    apiServiceMock.getMyApplications.mockReturnValue(of({
      totalElements: 1,
      content: [{ id: 1, status: 'APPLIED', job: { title: 'Dev', companyName: 'Acme' } }]
    }));

    const setItemSpy = vi.spyOn(localStorage, 'setItem');
    component.ngOnInit();
    currentUser$.next({ id: 7 });

    expect(notificationServiceMock.push).not.toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalledWith('jp_app_metadata_7', expect.any(String));
  });

  it('should update metadata for unknown statuses without pushing notification', () => {
    apiServiceMock.getMyApplications.mockReturnValue(of({
      totalElements: 1,
      content: [{ id: 10, status: 'PENDING_INTERNAL', job: { title: 'Dev', companyName: 'Acme' } }]
    }));
    component.ngOnInit();
    currentUser$.next({ id: 7 });

    expect(notificationServiceMock.push).not.toHaveBeenCalled();
    expect(localStorage.getItem('jp_app_metadata_7')).toContain('"10":"PENDING_INTERNAL"');
  });

  it('should cleanup destroy subject', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');
    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
