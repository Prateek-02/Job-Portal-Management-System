import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ManageApplicationsComponent } from './manage-applications.component';
import { ApiService } from '../../../../core/services/api.service';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';

describe('ManageApplicationsComponent', () => {
  let component: ManageApplicationsComponent;
  let fixture: ComponentFixture<ManageApplicationsComponent>;
  let apiServiceMock: any;
  let paramMapSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    apiServiceMock = {
      getJobById: vi.fn(),
      getJobApplications: vi.fn(),
      updateApplicationStatus: vi.fn()
    };
    
    paramMapSubject = new BehaviorSubject({ get: () => '101' });

    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(ErrorHandlerUtil, 'getFriendlyError').mockReturnValue('Friendly mapped error');

    await TestBed.configureTestingModule({
      imports: [ManageApplicationsComponent, DatePipe, PaginationComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } }
      ]
    })
    .overrideComponent(ManageApplicationsComponent, {
      set: { imports: [DatePipe], schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(ManageApplicationsComponent);
    component = fixture.componentInstance;
  }

  describe('Initialization and Loading (Boundary / Normal)', () => {
    it('should silently ignore job load anomalies implicitly per code bounds', () => {
      apiServiceMock.getJobById.mockReturnValue(throwError(() => new Error('Job Not found silent drop')));
      apiServiceMock.getJobApplications.mockReturnValue(of({ content: [] }));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(component.job).toBeNull();
      // Flow completes cleanly not crashing
    });

    it('should execute primary flows smoothly natively subscribing to router sequences', () => {
      apiServiceMock.getJobById.mockReturnValue(of({ id: 101, title: 'Engineer' }));
      apiServiceMock.getJobApplications.mockReturnValue(of({
        content: [{ id: 1, status: 'APPLIED' }],
        totalElements: 1,
        totalPages: 1
      }));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(apiServiceMock.getJobById).toHaveBeenCalledWith(101);
      expect(apiServiceMock.getJobApplications).toHaveBeenCalledWith(101, 0, 10);
      expect(component.job?.title).toBe('Engineer');
      expect(component.applications.length).toBe(1);
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
      apiServiceMock.updateApplicationStatus.mockReturnValue(throwError(() => new Error('Bad network')));
      setupComponent();
      fixture.detectChanges();
      
      const app = { id: 7, status: 'APPLIED' } as any;
      component.updateStatus(app, 'REJECTED');
      
      expect(window.alert).toHaveBeenCalledWith('Friendly mapped error');
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
