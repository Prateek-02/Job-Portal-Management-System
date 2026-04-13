import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuickReviewQueueComponent } from './quick-review-queue.component';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { ApiService } from '../../../../../../../core/services/api.service';
import { ChangeDetectorRef } from '@angular/core';

describe('QuickReviewQueueComponent', () => {
  let component: QuickReviewQueueComponent;
  let fixture: ComponentFixture<QuickReviewQueueComponent>;
  let currentUser$: BehaviorSubject<any>;
  let apiServiceMock: any;
  let cdrMock: any;

  beforeEach(async () => {
    currentUser$ = new BehaviorSubject<any>(null);
    apiServiceMock = {
      getJobsByRecruiter: vi.fn(),
      getJobApplications: vi.fn(),
      updateApplicationStatus: vi.fn()
    };
    cdrMock = { detectChanges: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [QuickReviewQueueComponent],
      providers: [
        { provide: AuthService, useValue: { currentUser$ } },
        { provide: ApiService, useValue: apiServiceMock },
        { provide: ChangeDetectorRef, useValue: cdrMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickReviewQueueComponent);
    component = fixture.componentInstance;
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });

  it('should load and sort pending applications for recruiter user', () => {
    apiServiceMock.getJobsByRecruiter.mockReturnValue(of({ content: [{ id: 7 }, { id: 8 }] }));
    apiServiceMock.getJobApplications
      .mockReturnValueOnce(of({ content: [{ id: 11, status: 'UNDER_REVIEW', applicantName: 'A' }, { id: 5, status: 'REJECTED', applicantName: 'B' }] }))
      .mockReturnValueOnce(of({ content: [{ id: 13, status: 'APPLIED', applicantName: 'C' }] }));

    component.ngOnInit();
    currentUser$.next({ id: 3 });

    expect(apiServiceMock.getJobsByRecruiter).toHaveBeenCalledWith(3);
    expect(component.pendingApplications.map(a => a.id)).toEqual([13, 11]);
  });

  it('should tolerate recruiter jobs request failure', () => {
    apiServiceMock.getJobsByRecruiter.mockReturnValue(throwError(() => new Error('boom')));
    component.ngOnInit();
    currentUser$.next({ id: 99 });
    expect(component.pendingApplications).toEqual([]);
  });

  it('should tolerate per-job applications failure', () => {
    apiServiceMock.getJobsByRecruiter.mockReturnValue(of({ content: [{ id: 7 }] }));
    apiServiceMock.getJobApplications.mockReturnValue(throwError(() => new Error('app failed')));
    component.ngOnInit();
    currentUser$.next({ id: 3 });
    expect(component.pendingApplications).toEqual([]);
  });

  it('should remove application after status update', () => {
    component.pendingApplications = [
      { id: 44, status: 'APPLIED', applicantName: 'A' } as any,
      { id: 12, status: 'UNDER_REVIEW', applicantName: 'B' } as any
    ];
    apiServiceMock.updateApplicationStatus.mockReturnValue(of({}));

    component.onUpdateStatus({ id: 44 } as any, 'SHORTLISTED');
    expect(apiServiceMock.updateApplicationStatus).toHaveBeenCalledWith(44, 'SHORTLISTED');
    expect(component.pendingApplications.map(a => a.id)).toEqual([12]);
  });

  it('should clean subscriptions on destroy', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');
    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
