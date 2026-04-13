import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobManagementComponent } from './job-management.component';
import { ApiService } from '../../../../core/services/api.service';
import { DatePipe } from '@angular/common';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';

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
    vi.spyOn(ErrorHandlerUtil, 'getFriendlyError').mockImplementation((err, context) => `Err: ${context}`);

    await TestBed.configureTestingModule({
      imports: [JobManagementComponent, DatePipe, PaginationComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceMock }
      ]
    })
    .overrideComponent(JobManagementComponent, {
      set: { imports: [DatePipe], schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(JobManagementComponent);
    component = fixture.componentInstance;
  }

  describe('Paging and Loading Sequences (Normal / Exception)', () => {
    it('should natively retrieve lists cleanly dynamically', () => {
      apiServiceMock.getAdminJobs.mockReturnValue(of({ content: [{ id: 1 }], totalElements: 1, totalPages: 1 }));
      setupComponent();
      fixture.detectChanges();
      
      expect(apiServiceMock.getAdminJobs).toHaveBeenCalledWith(0, 10);
      expect(component.jobs.length).toBe(1);
      expect(component.isLoading).toBe(false);
    });

    it('should process navigation requests identically fetching bounds automatically', () => {
      apiServiceMock.getAdminJobs.mockReturnValue(of({ content: [] }));
      setupComponent();
      fixture.detectChanges();
      
      component.onPageChange(4);
      expect(component.currentPage).toBe(4);
      expect(apiServiceMock.getAdminJobs).toHaveBeenCalledWith(4, 10);
    });

    it('should propagate API failing logic smoothly delegating util handlers cleanly securely', () => {
      apiServiceMock.getAdminJobs.mockReturnValue(throwError(() => new Error('Broken')));
      setupComponent();
      fixture.detectChanges();
      
      expect(component.errorMessage).toBe('Err: load_jobs');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Deletion Handling Strategy (Boundary / Exception / Normal)', () => {
    it('should block logic paths when DOM confirm is false implicitly naturally mapping limits', () => {
      apiServiceMock.getAdminJobs.mockReturnValue(of({ content: [{ id: 10 }] }));
      setupComponent();
      fixture.detectChanges();
      
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      component.deleteJob(10);
      
      expect(apiServiceMock.deleteJob).not.toHaveBeenCalled();
    });

    it('should trigger delete and mutate structural collections purely omitting filtered elements', () => {
      apiServiceMock.getAdminJobs.mockReturnValue(of({ content: [{ id: 10 }, { id: 20 }] }));
      apiServiceMock.deleteJob.mockReturnValue(of({}));
      setupComponent();
      fixture.detectChanges();
      
      component.deleteJob(10);
      
      expect(apiServiceMock.deleteJob).toHaveBeenCalledWith(10);
      expect(component.deletingId).toBeNull();
      expect(component.jobs.length).toBe(1);
      expect(component.jobs[0].id).toBe(20);
    });

    it('should intercept failing deletions dynamically raising system alerts manually bound', () => {
      apiServiceMock.getAdminJobs.mockReturnValue(of({ content: [{ id: 10 }] }));
      apiServiceMock.deleteJob.mockReturnValue(throwError(() => new Error('Limit')));
      setupComponent();
      fixture.detectChanges();
      
      component.deleteJob(10);
      
      expect(window.alert).toHaveBeenCalledWith('Err: delete_job');
      expect(component.deletingId).toBeNull();
      expect(component.jobs.length).toBe(1); // Undamaged
    });
  });
});
