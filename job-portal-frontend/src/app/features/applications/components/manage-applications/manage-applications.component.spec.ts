import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ManageApplicationsComponent } from './manage-applications.component';
import { ApiService } from '../../../../core/services/api.service';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';
import { provideRouter } from '@angular/router';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ManageApplicationsComponent', () => {
  let component: ManageApplicationsComponent;
  let fixture: ComponentFixture<ManageApplicationsComponent>;
  let apiServiceMock: any;
  let paramMapSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    apiServiceMock = {
      getJobById: vi.fn().mockReturnValue(of({})),
      getJobApplications: vi.fn().mockReturnValue(of({ content: [], totalElements: 0, totalPages: 0 })),
      updateApplicationStatus: vi.fn().mockReturnValue(of({}))
    };
    
    paramMapSubject = new BehaviorSubject({ get: () => '101' });

    vi.spyOn(window, 'alert').mockImplementation(() => {});
    // ErrorHandlerUtil is mocked at top level

    await TestBed.configureTestingModule({
      imports: [ManageApplicationsComponent, DatePipe, PaginationComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock },
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(ManageApplicationsComponent);
    component = fixture.componentInstance;
  }

  describe('Initialization and Loading (Boundary / Normal)', () => {
    it('should silently ignore job load anomalies implicitly per code bounds', () => {
      apiServiceMock.getJobById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      apiServiceMock.getJobApplications.mockReturnValue(of({ content: [] }));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(component.job).toBeNull();
      // Flow completes cleanly not crashing
    });

    it('should execute primary flows smoothly natively subscribing to router sequences', () => {
      apiServiceMock.getJobById.mockReturnValue(of({ id: 101, title: 'Engineer' }));
      apiServiceMock.getJobApplications.mockReturnValue(of({
        content: [{ id: 1, status: 'APPLIED', applicantName: 'Alice', applicantEmail: 'alice@example.com', appliedAt: '2026-04-01', resumeUrl: 'http://x' }],
        totalElements: 1,
        totalPages: 1
      }));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(component.job?.title).toBe('Engineer');
      expect(component.applications.length).toBe(1);
    });

    it('should handle application load error gracefully', () => {
      apiServiceMock.getJobById.mockReturnValue(of({ id: 101 }));
      apiServiceMock.getJobApplications.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
      expect(component.isLoading).toBe(false);
    });

    it('should handle null content response gracefully', () => {
      apiServiceMock.getJobById.mockReturnValue(of({ id: 101 }));
      apiServiceMock.getJobApplications.mockReturnValue(of({ content: null, totalElements: 0, totalPages: 0 }));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(component.applications).toEqual([]);
    });
  });

  describe('Operations Execution (Normal / Exception / Boundary)', () => {
    it('should push status modifications mapping natively correctly mapping statuses', () => {
      apiServiceMock.getJobById.mockReturnValue(of({ id: 101 }));
      apiServiceMock.getJobApplications.mockReturnValue(of({ content: [] }));
      apiServiceMock.updateApplicationStatus.mockReturnValue(of({ status: 'SHORTLISTED' }));
      setupComponent();
      fixture.detectChanges();
      
      const app = { id: 7, status: 'APPLIED' } as any;
      component.updateStatus(app, 'SHORTLISTED');
      
      expect(apiServiceMock.updateApplicationStatus).toHaveBeenCalledWith(7, 'SHORTLISTED');
      expect(app.status).toBe('SHORTLISTED');
      expect(component.updatingId).toBeNull();
    });

    it('should intercept update API breakdowns delegating structurally to explicit alerts', () => {
      apiServiceMock.getJobById.mockReturnValue(of({ id: 101 }));
      apiServiceMock.getJobApplications.mockReturnValue(of({ content: [] }));
      apiServiceMock.updateApplicationStatus.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      setupComponent();
      fixture.detectChanges();
      
      const app = { id: 7, status: 'APPLIED' } as any;
      component.updateStatus(app, 'REJECTED');
      
      expect(window.alert).toHaveBeenCalledWith('Something went wrong on our end. Please try again shortly.');
      expect(component.updatingId).toBeNull(); // ID explicitly unlocked mapped limit
    });

    it('should seamlessly process page boundary parameters invoking secondary reload flows gracefully', () => {
      apiServiceMock.getJobById.mockReturnValue(of({ id: 101 }));
      apiServiceMock.getJobApplications.mockReturnValue(of({ content: [] }));
      setupComponent();
      fixture.detectChanges();
      
      apiServiceMock.getJobApplications.mockClear();
      component.onPageChange(3);
      
      expect(component.currentPage).toBe(3);
      expect(apiServiceMock.getJobApplications).toHaveBeenCalledWith(101, 3, 10);
    });

    it('should map unknown status values rendering gracefully mapping generic boundaries', () => {
      setupComponent();
      expect(component.statusClass('APPLIED')).toContain('bg-blue-500');
      expect(component.statusClass('WEIRD_VALUE' as any)).toContain('bg-gray-500');
    });
  });
});
