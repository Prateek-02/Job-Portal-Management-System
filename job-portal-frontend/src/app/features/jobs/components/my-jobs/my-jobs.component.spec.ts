import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyJobsComponent } from './my-jobs.component';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('MyJobsComponent', () => {
  let component: MyJobsComponent;
  let fixture: ComponentFixture<MyJobsComponent>;
  let apiServiceMock: any;
  let authServiceMock: any;

  beforeEach(async () => {
    apiServiceMock = {
      getJobsByRecruiter: vi.fn(),
      deleteJob: vi.fn()
    };
    
    authServiceMock = {
      getCurrentUser: vi.fn()
    };

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [MyJobsComponent, DatePipe, PaginationComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: {} }
      ]
    })
    .overrideComponent(MyJobsComponent, {
      set: { imports: [DatePipe], schemas: ['NO_ERRORS_SCHEMA' as any] } // Mock RouterLink
    })
    .compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(MyJobsComponent);
    component = fixture.componentInstance;
  }

  describe('Initialization (Boundary condition)', () => {
    it('should halt execution cleanly failing fast when active global user bounds unmapped entirely', () => {
      authServiceMock.getCurrentUser.mockReturnValue(null);
      setupComponent();
      fixture.detectChanges();
      
      expect(apiServiceMock.getJobsByRecruiter).not.toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });

    it('should seamlessly execute API and map page metadata strictly when valid user exists natively', () => {
      authServiceMock.getCurrentUser.mockReturnValue({ id: 10 });
      apiServiceMock.getJobsByRecruiter.mockReturnValue(of({ 
        content: [{ id: 1, title: 'Job 1' }], totalElements: 1, totalPages: 1 
      }));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(apiServiceMock.getJobsByRecruiter).toHaveBeenCalledWith(10, 0, 8);
      expect(component.jobs.length).toBe(1);
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Deletion Strategy (Normal / Exception / Boundary)', () => {
    it('should conditionally halt payload submission natively when prompt boundary confirms implicitly false', () => {
      authServiceMock.getCurrentUser.mockReturnValue({ id: 10 });
      apiServiceMock.getJobsByRecruiter.mockReturnValue(of({ content: [{ id: 99 }] }));
      setupComponent();
      fixture.detectChanges();
      
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      component.deleteJob(99);
      expect(apiServiceMock.deleteJob).not.toHaveBeenCalled();
    });

    it('should safely omit structurally deleted entities locally seamlessly', () => {
      authServiceMock.getCurrentUser.mockReturnValue({ id: 10 });
      apiServiceMock.getJobsByRecruiter.mockReturnValue(of({ content: [{ id: 99 }, { id: 100 }] }));
      apiServiceMock.deleteJob.mockReturnValue(of({}));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(component.jobs.length).toBe(2);
      
      component.deleteJob(99);
      
      expect(apiServiceMock.deleteJob).toHaveBeenCalledWith(99);
      expect(component.jobs.length).toBe(1);
      expect(component.jobs[0].id).toBe(100); // Verified correctly filtered
    });

    it('should securely handle API exceptions structurally propagating error signals explicitly via core logic alerts directly mapped limit constraints', () => {
      authServiceMock.getCurrentUser.mockReturnValue({ id: 10 });
      apiServiceMock.getJobsByRecruiter.mockReturnValue(of({ content: [{ id: 99 }] }));
      apiServiceMock.deleteJob.mockReturnValue(throwError(() => new Error('Delete constraint limit')));
      
      setupComponent();
      fixture.detectChanges();
      
      component.deleteJob(99);
      
      expect(window.alert).toHaveBeenCalledWith('Delete constraint limit');
      expect(component.jobs.length).toBe(1); // Wasn't removed natively
    });
  });

  describe('Pagination & Formatting', () => {
    it('should seamlessly trigger secondary structural mapping queries contextually processing load requirements automatically dynamically', () => {
      authServiceMock.getCurrentUser.mockReturnValue({ id: 10 });
      apiServiceMock.getJobsByRecruiter.mockReturnValue(of({ content: [] }));
      setupComponent();
      fixture.detectChanges();
      
      apiServiceMock.getJobsByRecruiter.mockClear();
      
      component.onPageChange(2);
      expect(component.currentPage).toBe(2);
      expect(apiServiceMock.getJobsByRecruiter).toHaveBeenCalledWith(10, 2, 8);
    });

    it('should apply boundary scaling safely converting numeric bounds directly for structural representations', () => {
      setupComponent();
      
      expect(component.formatSalary(undefined)).toBe('N/A');
      expect(component.formatSalary(90000)).toBe('₹90,000');
      expect(component.formatSalary(1200000)).toBe('₹12.0L');
    });
  });
});
