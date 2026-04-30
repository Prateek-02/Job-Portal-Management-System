import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyJobsComponent } from './my-jobs.component';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Router, provideRouter, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

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
      imports: [MyJobsComponent, DatePipe, PaginationComponent, ModalComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();
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
        content: [{ id: 1, title: 'Job 1', companyName: 'TestCorp' }], totalElements: 1, totalPages: 1 
      }));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(apiServiceMock.getJobsByRecruiter).toHaveBeenCalledWith(10, 0, 8);
      expect(component.jobs.length).toBe(1);
      expect(component.isLoading).toBe(false);
    });

    it('should handle API errors via catchError fallback gracefully', () => {
      authServiceMock.getCurrentUser.mockReturnValue({ id: 10 });
      apiServiceMock.getJobsByRecruiter.mockReturnValue(throwError(() => new Error('Stream fail')));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(component.jobs).toEqual([]);
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Deletion Strategy (Normal / Exception / Boundary)', () => {
    it('should show delete modal when confirmDelete is called', () => {
      authServiceMock.getCurrentUser.mockReturnValue({ id: 10 });
      const job = { id: 99, title: 'Job 1', companyName: 'TestCorp' } as any;
      apiServiceMock.getJobsByRecruiter.mockReturnValue(of({ content: [job] }));
      setupComponent();
      fixture.detectChanges();
      
      component.confirmDelete(job);
      
      expect(component.showDeleteModal).toBe(true);
      expect(component.jobToDelete).toEqual(job);
    });

    it('should safely omit structurally deleted entities locally seamlessly', () => {
      authServiceMock.getCurrentUser.mockReturnValue({ id: 10 });
      const job1 = { id: 99, title: 'Job 1', companyName: 'TestCorp' } as any;
      const job2 = { id: 100, title: 'Job 2', companyName: 'TestCorp' } as any;
      apiServiceMock.getJobsByRecruiter.mockReturnValue(of({ content: [job1, job2] }));
      apiServiceMock.deleteJob.mockReturnValue(of({}));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(component.jobs.length).toBe(2);
      
      component.confirmDelete(job1);
      component.executeDelete();
      
      expect(apiServiceMock.deleteJob).toHaveBeenCalledWith(99);
      expect(component.jobs.length).toBe(1);
      expect(component.jobs[0].id).toBe(100);
      expect(component.successMessage).toBe('Job deleted successfully');
    });

    it('should securely handle API exceptions structurally setting error message logically dynamically', () => {
      authServiceMock.getCurrentUser.mockReturnValue({ id: 10 });
      const job = { id: 99, title: 'Job 1', companyName: 'TestCorp' } as any;
      apiServiceMock.getJobsByRecruiter.mockReturnValue(of({ content: [job] }));
      apiServiceMock.deleteJob.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      
      setupComponent();
      fixture.detectChanges();
      
      component.confirmDelete(job);
      component.executeDelete();
      
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
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
