import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RecommendedJobsComponent } from './recommended-jobs.component';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ApiService } from '../../../../../../../core/services/api.service';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../../../core/services/notification.service';

describe('RecommendedJobsComponent', () => {
  let component: RecommendedJobsComponent;
  let fixture: ComponentFixture<RecommendedJobsComponent>;
  let apiServiceMock: any;
  let notificationServiceMock: any;
  let currentUser$: BehaviorSubject<any>;

  beforeEach(async () => {
    currentUser$ = new BehaviorSubject<any>(null);
    apiServiceMock = { getJobs: vi.fn() };
    notificationServiceMock = { push: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RecommendedJobsComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthService, useValue: { currentUser$ } },
        { provide: NotificationService, useValue: notificationServiceMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    localStorage.clear();
    fixture = TestBed.createComponent(RecommendedJobsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });

  it('should load jobs for authenticated user and emit notifications for unseen jobs', () => {
    apiServiceMock.getJobs.mockReturnValue(of({
      content: [
        { id: 1, title: 'Dev', companyName: 'Acme', location: 'Remote', salary: 120000 },
        { id: 2, title: 'QA', companyName: 'Beta', location: 'Pune', salary: 80000 }
      ]
    }));

    component.ngOnInit();
    currentUser$.next({ id: 99 });

    expect(apiServiceMock.getJobs).toHaveBeenCalledWith(0, 4);
    expect(component.recentJobs.length).toBe(2);
    expect(component.isLoadingJobs).toBe(false);
    expect(notificationServiceMock.push).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('jp_seen_jobs_99')).toBe(JSON.stringify([1, 2]));
  });

  it('should not duplicate notifications for already seen jobs', () => {
    localStorage.setItem('jp_seen_jobs_5', JSON.stringify([1]));
    apiServiceMock.getJobs.mockReturnValue(of({
      content: [{ id: 1, title: 'Dev', companyName: 'Acme', location: 'Remote', salary: 120000 }]
    }));

    component.ngOnInit();
    currentUser$.next({ id: 5 });

    expect(notificationServiceMock.push).not.toHaveBeenCalled();
    expect(localStorage.getItem('jp_seen_jobs_5')).toBe(JSON.stringify([1]));
  });

  it('should stop loading flag when jobs call fails', () => {
    apiServiceMock.getJobs.mockReturnValue(throwError(() => new Error('x')));
    component.ngOnInit();
    currentUser$.next({ id: 1 });
    expect(component.isLoadingJobs).toBe(false);
  });

  it('should format salaries in both lakh and locale branches', () => {
    expect(component.formatSalary(150000)).toBe('₹1.5L');
    expect(component.formatSalary(95000)).toBe('₹95,000');
  });

  it('should complete destroy subject on ngOnDestroy', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');
    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
