import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AllApplicationsComponent } from './all-applications.component';
import { ApiService } from '../../../../core/services/api.service';
import { DatePipe, CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AllApplicationsComponent', () => {
  let component: AllApplicationsComponent;
  let fixture: ComponentFixture<AllApplicationsComponent>;
  let apiServiceMock: any;

  beforeEach(async () => {
    apiServiceMock = {
      getAllRecruiterApplications: vi.fn(),
      updateApplicationStatus: vi.fn()
    };

    // ErrorHandlerUtil is mocked at top level
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [AllApplicationsComponent, DatePipe, PaginationComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(AllApplicationsComponent);
    component = fixture.componentInstance;
  }

  describe('Initialization (Normal / Exception)', () => {
    it('should cleanly init boundary conditions pulling applications normally', () => {
      apiServiceMock.getAllRecruiterApplications.mockReturnValue(of({
        content: [
          { id: 1, status: 'APPLIED', applicantName: 'Alice', applicantEmail: 'alice@example.com', jobTitle: 'Engineer', companyName: 'Acme', appliedAt: '2026-04-01', resumeUrl: 'http://x' },
          { id: 2, status: 'SHORTLISTED', applicantName: 'Bob', applicantEmail: 'bob@example.com', jobTitle: 'Developer', companyName: 'Acme', appliedAt: '2026-04-01', resumeUrl: 'http://x' }
        ],
        totalElements: 2,
        totalPages: 1
      }));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(apiServiceMock.getAllRecruiterApplications).toHaveBeenCalledWith(0, 10);
      expect(component.applications.length).toBe(2);
      expect(component.isLoading).toBe(false);
      
      // Native mapping
      expect(component.getCountByStatus('APPLIED')).toBe(1);
      expect(component.getCountByStatus('REJECTED')).toBe(0);
    });

    it('should natively propagate internal loading exceptions appropriately', () => {
      apiServiceMock.getAllRecruiterApplications.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      
      setupComponent();
      fixture.detectChanges();
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Status Management (Normal / Boundary / Exception)', () => {
    it('should strictly skip API calls when identically bounding old to new updates seamlessly', () => {
      apiServiceMock.getAllRecruiterApplications.mockReturnValue(of({ content: [] }));
      setupComponent();
      fixture.detectChanges();
      
      const app = { id: 5, status: 'APPLIED' } as any;
      component.updateStatus(app, 'APPLIED');
      
      expect(apiServiceMock.updateApplicationStatus).not.toHaveBeenCalled();
    });

    it('should cleanly submit mapping transitions and mutate local entity structurally', () => {
      apiServiceMock.getAllRecruiterApplications.mockReturnValue(of({ content: [] }));
      apiServiceMock.updateApplicationStatus.mockReturnValue(of({ status: 'REJECTED' }));
      setupComponent();
      fixture.detectChanges();
      
      const app = { id: 5, status: 'APPLIED' } as any;
      component.updateStatus(app, 'REJECTED');
      
      expect(apiServiceMock.updateApplicationStatus).toHaveBeenCalledWith(5, 'REJECTED');
      expect(app.status).toBe('REJECTED');
      expect(component.updatingId).toBeNull();
    });

    it('should protect unhandled exceptions safely firing DOM alerts when bounds exceeded', () => {
      apiServiceMock.getAllRecruiterApplications.mockReturnValue(of({ content: [] }));
      apiServiceMock.updateApplicationStatus.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      setupComponent();
      fixture.detectChanges();
      
      const app = { id: 5, status: 'APPLIED' } as any;
      component.updateStatus(app, 'SHORTLISTED');
      
      expect(window.alert).toHaveBeenCalledWith('Something went wrong on our end. Please try again shortly.');
      expect(component.updatingId).toBeNull(); // Clean up successfully
    });

    it('should fallback securely to generic css constants natively', () => {
      setupComponent();
      expect(component.statusClass('APPLIED')).toContain('bg-blue-500');
      expect(component.statusClass('UNKNOWN_BOUNDARY_STATUS' as any)).toContain('bg-gray-500');
    });
  });
  
  describe('Pagination Limits', () => {
    it('should route bounds constraints mapping correctly sequentially', () => {
      apiServiceMock.getAllRecruiterApplications.mockReturnValue(of({ content: [] }));
      setupComponent();
      fixture.detectChanges();
      
      component.onPageChange(2);
      expect(component.currentPage).toBe(2);
      expect(apiServiceMock.getAllRecruiterApplications).toHaveBeenCalledWith(2, 10);
    });
  });
});
