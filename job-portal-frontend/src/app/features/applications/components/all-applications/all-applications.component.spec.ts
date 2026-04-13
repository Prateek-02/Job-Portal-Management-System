import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AllApplicationsComponent } from './all-applications.component';
import { ApiService } from '../../../../core/services/api.service';
import { DatePipe } from '@angular/common';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';

describe('AllApplicationsComponent', () => {
  let component: AllApplicationsComponent;
  let fixture: ComponentFixture<AllApplicationsComponent>;
  let apiServiceMock: any;

  beforeEach(async () => {
    apiServiceMock = {
      getAllRecruiterApplications: vi.fn(),
      updateApplicationStatus: vi.fn()
    };

    vi.spyOn(ErrorHandlerUtil, 'getFriendlyError').mockReturnValue('Application specific error');
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [AllApplicationsComponent, DatePipe, PaginationComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceMock }
      ]
    })
    .overrideComponent(AllApplicationsComponent, {
      set: { imports: [DatePipe], schemas: ['NO_ERRORS_SCHEMA' as any] } // Mock RouterLink
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
        content: [{ id: 1, status: 'APPLIED' }, { id: 2, status: 'SHORTLISTED' }],
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
      apiServiceMock.getAllRecruiterApplications.mockReturnValue(throwError(() => new Error('Server dead')));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(component.errorMessage).toBe('Application specific error');
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
      apiServiceMock.updateApplicationStatus.mockReturnValue(throwError(() => new Error('Fail bounds')));
      setupComponent();
      fixture.detectChanges();
      
      const app = { id: 5, status: 'APPLIED' } as any;
      component.updateStatus(app, 'SHORTLISTED');
      
      expect(window.alert).toHaveBeenCalledWith('Application specific error');
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
