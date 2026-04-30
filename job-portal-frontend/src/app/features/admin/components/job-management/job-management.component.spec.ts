import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobManagementComponent } from './job-management.component';
import { ApiService } from '../../../../core/services/api.service';
import { DatePipe } from '@angular/common';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('JobManagementComponent', () => {
  let component: JobManagementComponent;
  let fixture: ComponentFixture<JobManagementComponent>;
  let apiServiceMock: any;

  beforeEach(async () => {
    apiServiceMock = {
      getAdminJobs: vi.fn(),
      deleteJob: vi.fn()
    };

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    // ErrorHandlerUtil is mocked at top level

    await TestBed.configureTestingModule({
      imports: [JobManagementComponent, DatePipe, PaginationComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(JobManagementComponent);
    component = fixture.componentInstance;
  }

  describe('Paging and Loading Sequences (Normal / Exception)', () => {
    it('should natively retrieve lists cleanly dynamically', () => {
      apiServiceMock.getAdminJobs.mockReturnValue(of({ content: [{ id: 1, title: 'Role', companyName: 'Acme', location: 'Remote', salary: 100000, createdAt: '2026-04-01' }], totalElements: 1, totalPages: 1 }));
      setupComponent();
      fixture.detectChanges();
      
      expect(apiServiceMock.getAdminJobs).toHaveBeenCalled();
      expect(component.jobs.length).toBe(1);
      expect(component.isLoading).toBe(false);
    });

    it('should handle null content response gracefully', () => {
      apiServiceMock.getAdminJobs.mockReturnValue(of(null));
      setupComponent();
      fixture.detectChanges();
      expect(component.jobs).toEqual([]);
    });

    it('should process navigation requests identically fetching bounds automatically', () => {
      apiServiceMock.getAdminJobs.mockReturnValue(of({ content: [], totalElements: 0, totalPages: 0 }));
      setupComponent();
      fixture.detectChanges();
      
      component.onPageChange(4);
      expect(component.currentPage).toBe(4);
      expect(apiServiceMock.getAdminJobs).toHaveBeenCalledWith(4, 10);
    });

    it('should propagate API failing logic smoothly delegating util handlers cleanly securely', () => {
      apiServiceMock.getAdminJobs.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      setupComponent();
      fixture.detectChanges();
      
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Deletion Handling Strategy (Boundary / Exception / Normal)', () => {
    it('should show delete modal when confirmDelete is called', () => {
      const job = { id: 10, title: 'Role', companyName: 'Acme', location: 'Remote', salary: 100000, createdAt: '2026-04-01' } as any;
      apiServiceMock.getAdminJobs.mockReturnValue(of({ content: [job] }));
      setupComponent();
      fixture.detectChanges();
      
      component.confirmDelete(job);
      
      expect(component.showDeleteModal).toBe(true);
      expect(component.jobToDelete).toEqual(job);
    });

    it('should trigger delete and mutate structural collections purely omitting filtered elements', () => {
      const job1 = { id: 10, title: 'Role 1', companyName: 'Acme', location: 'Remote', salary: 100000, createdAt: '2026-04-01' } as any;
      const job2 = { id: 20, title: 'Role 2', companyName: 'Acme', location: 'Remote', salary: 110000, createdAt: '2026-04-01' } as any;
      apiServiceMock.getAdminJobs.mockReturnValue(of({ content: [job1, job2] }));
      apiServiceMock.deleteJob.mockReturnValue(of({}));
      setupComponent();
      fixture.detectChanges();
      
      component.confirmDelete(job1);
      component.executeDelete();
      
      expect(apiServiceMock.deleteJob).toHaveBeenCalledWith(10);
      expect(component.deletingId).toBeNull();
      expect(component.jobs.length).toBe(1);
      expect(component.jobs[0].id).toBe(20);
      expect(component.successMessage).toBe('Job deleted successfully');
    });

    it('should intercept failing deletions dynamically setting error message manually bound', () => {
      const job = { id: 10, title: 'Role', companyName: 'Acme', location: 'Remote', salary: 100000, createdAt: '2026-04-01' } as any;
      apiServiceMock.getAdminJobs.mockReturnValue(of({ content: [job] }));
      apiServiceMock.deleteJob.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      setupComponent();
      fixture.detectChanges();
      
      component.confirmDelete(job);
      component.executeDelete();
      
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
      expect(component.deletingId).toBeNull();
      expect(component.jobs.length).toBe(1); // Undamaged
    });
  });
});
