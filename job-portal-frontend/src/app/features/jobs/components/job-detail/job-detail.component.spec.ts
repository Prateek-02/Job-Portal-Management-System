import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobDetailComponent } from './job-detail.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';
import { provideRouter } from '@angular/router';

describe('JobDetailComponent', () => {
  let component: JobDetailComponent;
  let fixture: ComponentFixture<JobDetailComponent>;
  let apiServiceMock: any;
  let authServiceMock: any;
  let routerMock: any;
  let routeParamsSubject: BehaviorSubject<any>;

  const mockJob = {
    id: 1,
    title: 'Backend Developer',
    companyName: 'Acme',
    location: 'Remote',
    salary: 90000,
    experience: 2,
    description: '<p>Role details</p>',
    recruiterId: 22,
    createdAt: '2026-04-01T00:00:00.000Z',
    skills: ['Java']
  };

  beforeEach(async () => {
    apiServiceMock = {
      getJobById: vi.fn().mockReturnValue(of(mockJob)),
      applyForJob: vi.fn()
    };
    
    authServiceMock = {
      isAuthenticated: vi.fn(),
      isJobSeeker: vi.fn().mockReturnValue(false),
      isRecruiter: vi.fn().mockReturnValue(false)
    };

    routerMock = {
      navigate: vi.fn()
    };

    routeParamsSubject = new BehaviorSubject({ get: () => '1' });

    // ErrorHandlerUtil is mocked at top level

    await TestBed.configureTestingModule({
      imports: [JobDetailComponent, ReactiveFormsModule, DatePipe],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: { paramMap: routeParamsSubject.asObservable() } }
      ]
    })
    .overrideComponent(JobDetailComponent, {
      set: { imports: [ReactiveFormsModule, DatePipe, CommonModule], schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(JobDetailComponent);
    component = fixture.componentInstance;
  }

  describe('Initialization (Normal / Exception)', () => {
    it('should extract param id and retrieve job from API', () => {
      apiServiceMock.getJobById.mockReturnValue(of({ ...mockJob, title: 'Dev' }));
      setupComponent();
      fixture.detectChanges();
      
      expect(apiServiceMock.getJobById).toHaveBeenCalledWith(1);
      expect(component.job?.title).toBe('Dev');
      expect(component.isLoading).toBe(false);
    });

    it('should display friendly error via util when API retrieval fails', () => {
      apiServiceMock.getJobById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      setupComponent();
      fixture.detectChanges();
      
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
      expect(component.job).toBeNull();
    });

    it('should skip loading when route id is invalid', () => {
      routeParamsSubject.next({ get: () => null });
      setupComponent();
      fixture.detectChanges();
      expect(apiServiceMock.getJobById).not.toHaveBeenCalled();
    });
  });

  describe('Navigation & Modal (Boundary / Normal)', () => {
    it('should redirect openApplyModal to login if unauthenticated strictly', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);
      setupComponent();
      fixture.detectChanges();
      
      component.openApplyModal();
      
      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
      expect(component.showApplyModal).toBe(false);
    });

    it('should cleanly reset internal parameters and open modal when authenticated', () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);
      setupComponent();
      fixture.detectChanges();
      
      // Simulate dirty modal bounds
      component.showApplyModal = false;
      component.applySuccess = true;
      component.applyError = 'Old error';
      component.selectedFile = new File([''], 'old.pdf');
      
      component.openApplyModal();
      
      expect(component.showApplyModal).toBe(true);
      expect(component.applySuccess).toBe(false);
      expect(component.applyError).toBe('');
      expect(component.selectedFile).toBeNull();
    });

    it('should navigate identically via query syntax for filterBySkill', () => {
      setupComponent();
      fixture.detectChanges();
      component.filterBySkill('Java');
      expect(routerMock.navigate).toHaveBeenCalledWith(['/jobs'], { queryParams: { skill: 'Java' } });
    });
  });

  describe('File Handling and Application Submission (Exception / Boundary / Normal)', () => {
    it('should boundary protect logic when missing files or valid active Job ID', () => {
      setupComponent();
      fixture.detectChanges();
      
      component.submitApplication(); // fails due to missing file / job null
      expect(apiServiceMock.applyForJob).not.toHaveBeenCalled();
      
      component.selectedFile = new File([''], 'cv.pdf');
      component.job = null;
      component.submitApplication(); // fails due to null job binding
      expect(apiServiceMock.applyForJob).not.toHaveBeenCalled();
    });

    it('should update reactive forms and selected fields onFileChange', () => {
      setupComponent();
      fixture.detectChanges();
      
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      const ev = { target: { files: [file] } } as any;
      
      component.onFileChange(ev);
      expect(component.selectedFile).toBe(file);
      expect(component.applyForm.value.resume).toBe(file);
    });

    it('should ignore file change when input has no files', () => {
      setupComponent();
      fixture.detectChanges();
      component.selectedFile = null;
      const ev = { target: { files: [] } } as any;
      component.onFileChange(ev);
      expect(component.selectedFile).toBeNull();
    });

    it('should effectively post file FormData stream and toggle success modal natively via asynchronous execution limits', async () => {
      vi.useFakeTimers();
      apiServiceMock.applyForJob.mockReturnValue(of({ id: 1 }));
      setupComponent();
      fixture.detectChanges(); 
      
      // Mock it up for test
      component.job = { id: 2 } as any;
      component.selectedFile = new File([''], 'test.pdf');
      
      component.submitApplication();
      
      expect(apiServiceMock.applyForJob).toHaveBeenCalledWith(2, component.selectedFile);
      expect(component.applySuccess).toBe(true);
      expect(component.isApplying).toBe(false);
      
      await vi.advanceTimersByTimeAsync(2500);
      expect(component.showApplyModal).toBe(false);
      vi.useRealTimers();
    });

    it('should catch payload applyForJob failures mapping standard errors globally', () => {
      apiServiceMock.applyForJob.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      setupComponent();
      
      // manual inject
      component.job = { id: 2 } as any;
      component.selectedFile = new File([''], 'test.pdf');
      
      component.submitApplication();
      
      expect(component.applyError).toBe('Something went wrong on our end. Please try again shortly.');
      expect(component.isApplying).toBe(false);
    });

    it('should not submit when job id is zero-like', () => {
      setupComponent();
      fixture.detectChanges();
      component.selectedFile = new File([''], 'test.pdf');
      component.job = { id: 0 } as any;
      component.submitApplication();
      expect(apiServiceMock.applyForJob).not.toHaveBeenCalled();
    });
  });
});
