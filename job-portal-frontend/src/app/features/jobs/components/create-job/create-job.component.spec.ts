import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateJobComponent } from './create-job.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';
import { provideRouter } from '@angular/router';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('CreateJobComponent', () => {
  let component: CreateJobComponent;
  let fixture: ComponentFixture<CreateJobComponent>;
  let apiServiceMock: any;
  let routerMock: any;
  let routeMock: any;

  beforeEach(async () => {
    apiServiceMock = {
      getJobById: vi.fn(),
      createJob: vi.fn(),
      updateJob: vi.fn()
    };
    
    routerMock = { navigate: vi.fn() };
    
    routeMock = {
      snapshot: { paramMap: { get: vi.fn().mockReturnValue(null) } }
    };

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await TestBed.configureTestingModule({
      imports: [CreateJobComponent, ReactiveFormsModule, ModalComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock },
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: Router, useValue: routerMock }
      ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(CreateJobComponent);
    component = fixture.componentInstance;
  }

  describe('Initialization (Normal / Exception)', () => {
    it('should initialize in create mode smoothly without API hits naturally', () => {
      setupComponent();
      fixture.detectChanges();
      
      expect(component.isEditMode).toBe(false);
      expect(component.jobId).toBeUndefined();
      expect(apiServiceMock.getJobById).not.toHaveBeenCalled();
    });

    it('should return early from loadJobDetails if jobId is undefined', () => {
      setupComponent();
      fixture.detectChanges();
      component.jobId = undefined;
      component.loadJobDetails();
    
      expect(apiServiceMock.getJobById).not.toHaveBeenCalled();
    });

    it('should initialize in edit mode and patch valid data seamlessly', () => {
      routeMock.snapshot.paramMap.get.mockReturnValue('101');
      apiServiceMock.getJobById.mockReturnValue(of({ 
        id: 101, title: 'Engineer', companyName: 'XYZ', location: 'Remote', salary: 100, experience: 3, description: 'Long text 12345678901234567890', jobType: 'Full-time', skills: ['Java', 'Spring']
      }));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(component.isEditMode).toBe(true);
      expect(component.jobId).toBe(101);
      expect(component.jobForm.value.title).toBe('Engineer');
      expect(component.jobForm.value.skills).toBe('Java, Spring'); // Restored mapping checks
    });

    it('should catch edit API fetching failures dynamically', () => {
      routeMock.snapshot.paramMap.get.mockReturnValue('101');
      apiServiceMock.getJobById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(component.errorMessage).toBe('Failed to load job details. Please try again.');
    });
  });

  describe('Form Validation & canDeactivate (Boundary)', () => {
    it('should halt execution if submission is dirty and form invalid natively', () => {
      setupComponent();
      fixture.detectChanges();
      
      const markSpy = vi.spyOn(component.jobForm, 'markAllAsTouched');
      component.onSubmit(); // defaults are invalid
      
      expect(markSpy).toHaveBeenCalled();
      expect(apiServiceMock.createJob).not.toHaveBeenCalled();
    });

    it('should protect unsaved data navigating away strictly via custom modal', () => {
      setupComponent();
      fixture.detectChanges();
      
      expect(component.canDeactivate()).toBe(true); // unaffected clean
      
      component.jobForm.markAsDirty();
      const deactivate$ = component.canDeactivate() as Observable<boolean>;
      expect(component.showDeactivateModal).toBe(true);
      
      let resolvedValue: boolean | undefined;
      deactivate$.subscribe(val => resolvedValue = val);
      
      component.onConfirmDeactivate();
      expect(resolvedValue).toBe(true);
      expect(component.showDeactivateModal).toBe(false);
      
      component.isSubmitting = true; // active submitting bypasses confirm
      expect(component.canDeactivate()).toBe(true);
    });

    it('should stay on page when cancel is clicked in deactivate modal', () => {
      setupComponent();
      fixture.detectChanges();
      
      component.jobForm.markAsDirty();
      const deactivate$ = component.canDeactivate() as Observable<boolean>;
      
      let resolvedValue: boolean | undefined;
      deactivate$.subscribe(val => resolvedValue = val);
      
      component.onCancelDeactivate();
      expect(resolvedValue).toBe(false);
      expect(component.showDeactivateModal).toBe(false);
    });
  });

  describe('Submission Modes (Normal / Boundary / Exception)', () => {
    let validFormState: any;
    
    beforeEach(() => {
      validFormState = {
        title: 'Tester',
        companyName: 'ABC',
        location: 'Remote',
        salary: 50,
        experience: 2,
        description: 'Test descriptions that is over thirty characters long',
        jobType: 'Full-time',
        skills: 'Testing, Protractor'
      };
    });

    it('should submit CREATE successfully mapping raw comma skills efficiently', async () => {
      vi.useFakeTimers();
      apiServiceMock.createJob.mockReturnValue(of({ id: 99 }));
      setupComponent();
      fixture.detectChanges();
      
      component.jobForm.setValue(validFormState);
      component.onSubmit();
      
      expect(apiServiceMock.createJob).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Tester',
        skills: ['Testing', 'Protractor']
      }));
      expect(component.successMessage).toContain('Job posted');
      
      // Navigation boundary - wait for 1500ms setTimeout in component
      await vi.advanceTimersByTimeAsync(1500);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/jobs', 99]);
      vi.useRealTimers();
    });

    it('should submit UPDATE successfully mapping empty skills gracefully to array', async () => {
      vi.useFakeTimers();
      routeMock.snapshot.paramMap.get.mockReturnValue('101');
      apiServiceMock.getJobById.mockReturnValue(of({ id: 101 }));
      apiServiceMock.updateJob.mockReturnValue(of({ id: 101 }));
      
      setupComponent();
      fixture.detectChanges();
      
      component.jobForm.setValue({ ...validFormState, skills: '' }); // empty skills edge
      component.onSubmit();
      
      expect(apiServiceMock.updateJob).toHaveBeenCalledWith(101, expect.objectContaining({
        skills: [] // cleanly mapped
      }));
      expect(component.successMessage).toContain('Job updated');
      
      await vi.advanceTimersByTimeAsync(1500);
      vi.useRealTimers();
    });

    it('should log submit errors elegantly directly off stream limits', () => {
      apiServiceMock.createJob.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      setupComponent();
      fixture.detectChanges();
      
      component.jobForm.setValue(validFormState);
      component.onSubmit();
      
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
    });

    it('should log submit errors for update appropriately', () => {
      routeMock.snapshot.paramMap.get.mockReturnValue('101');
      apiServiceMock.getJobById.mockReturnValue(of({ id: 101 }));
      apiServiceMock.updateJob.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      setupComponent();
      fixture.detectChanges();
      
      component.jobForm.setValue(validFormState);
      component.onSubmit();
      
      // Verifies the this.isEditMode ternary inside getFriendlyError
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
    });
  });
});
