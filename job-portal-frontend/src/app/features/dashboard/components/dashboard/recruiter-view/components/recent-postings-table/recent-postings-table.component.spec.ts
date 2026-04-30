import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecentPostingsTableComponent } from './recent-postings-table.component';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ApiService } from '../../../../../../../core/services/api.service';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { DashboardPollingService } from '../../../../../../../core/services/dashboard-polling.service';
import { ChangeDetectorRef } from '@angular/core';

import { ModalComponent } from '../../../../../../../shared/components/modal/modal.component';
import { vi } from 'vitest';

describe('RecentPostingsTableComponent', () => {
  let component: RecentPostingsTableComponent;
  let fixture: ComponentFixture<RecentPostingsTableComponent>;
  let currentUser$: BehaviorSubject<any>;
  let recruiterData$: BehaviorSubject<any>;
  let apiServiceMock: any;
  let cdrMock: any;

  beforeEach(async () => {
    currentUser$ = new BehaviorSubject<any>(null);
    recruiterData$ = new BehaviorSubject<any>({});
    apiServiceMock = {
      deleteJob: vi.fn()
    };
    cdrMock = { detectChanges: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RecentPostingsTableComponent, ModalComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock },
        { provide: DashboardPollingService, useValue: { recruiterData$ } },
        { provide: AuthService, useValue: { currentUser$ } },
        { provide: ChangeDetectorRef, useValue: cdrMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecentPostingsTableComponent);
    component = fixture.componentInstance;
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe recruiter polling and cap jobs to five', () => {
    component.ngOnInit();
    currentUser$.next({ id: 1, role: 'RECRUITER' });
    recruiterData$.next({
      jobs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }]
    });

    expect(component.myPostedJobs.map(x => x.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('should ignore non recruiter users', () => {
    component.ngOnInit();
    currentUser$.next({ id: 1, role: 'JOB_SEEKER' });
    recruiterData$.next({ jobs: [{ id: 1 }] });
    expect(component.myPostedJobs).toEqual([]);
  });

  it('should show delete modal when confirmDelete is called', () => {
    const job = { id: 10 } as any;
    component.confirmDelete(job);
    expect(component.showDeleteModal).toBe(true);
    expect(component.jobToDelete).toEqual(job);
  });

  it('should delete posting on executeDelete and remove item from list', () => {
    const job = { id: 10 } as any;
    component.myPostedJobs = [job, { id: 20 } as any];
    apiServiceMock.deleteJob.mockReturnValue(of({}));

    component.confirmDelete(job);
    component.executeDelete();
    
    expect(apiServiceMock.deleteJob).toHaveBeenCalledWith(10);
    expect(component.myPostedJobs.map(x => x.id)).toEqual([20]);
    expect(component.successMessage).toBe('Job deleted successfully');
  });

  it('should set error message on delete failure', () => {
    const job = { id: 10 } as any;
    component.myPostedJobs = [job];
    apiServiceMock.deleteJob.mockReturnValue(throwError(() => ({ status: 500 })));

    component.confirmDelete(job);
    component.executeDelete();
    
    expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
    expect(component.myPostedJobs.length).toBe(1);
  });

  it('should cleanup destroy subject', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');
    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
