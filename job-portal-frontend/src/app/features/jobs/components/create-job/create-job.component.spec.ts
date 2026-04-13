import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CreateJobComponent } from './create-job.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';

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
    vi.spyOn(ErrorHandlerUtil, 'getFriendlyError').mockReturnValue('Form submission generated error');

    await TestBed.configureTestingModule({
      imports: [CreateJobComponent, ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: routeMock }
      ]
    })
    .overrideComponent(CreateJobComponent, {
      set: { imports: [ReactiveFormsModule], schemas: ['NO_ERRORS_SCHEMA' as any] } // Mock ngx-editor and routerlink
    })
    .compileComponents();
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

    it('should initialize in edit mode and patch valid data seamlessly', () => {
      routeMock.snapshot.paramMap.get.mockReturnValue('101');
      apiServiceMock.getJobById.mockReturnValue(of({ 
        id: 101, title: 'Engineer', companyName: 'XYZ', location: 'Remote', salary: 100, experience: 3, description: 'Long text 12345678901234567890', skills: ['Java', 'Spring']
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
      apiServiceMock.getJobById.mockReturnValue(throwError(() => new Error('API down')));
      
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

    it('should protect unsaved data navigating away strictly via strict confirmation', () => {
      setupComponent();
      fixture.detectChanges();
      
      expect(component.canDeactivate()).toBe(true); // unaffected clean
      
      component.jobForm.markAsDirty();
      component.canDeactivate(); 
      expect(window.confirm).toHaveBeenCalled(); // dirty form raises modal
      
      component.isSubmitting = true; // active submitting bypasses confirm
      expect(component.canDeactivate()).toBe(true);
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
        skills: 'Testing, Protractor'
      };
    });

    it('should submit CREATE successfully mapping raw comma skills efficiently', fakeAsync(() => {
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
      
      tick(1500); // Navigation boundary 
      expect(routerMock.navigate).toHaveBeenCalledWith(['/jobs', 99]);
    }));

    it('should submit UPDATE successfully mapping empty skills gracefully to array', fakeAsync(() => {
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
      
      tick(1500);
    }));

    it('should log submit errors elegantly directly off stream limits', () => {
      apiServiceMock.createJob.mockReturnValue(throwError(() => new Error('Post failed')));
      setupComponent();
      fixture.detectChanges();
      
      component.jobForm.setValue(validFormState);
      component.onSubmit();
      
      expect(ErrorHandlerUtil.getFriendlyError).toHaveBeenCalled();
      expect(component.errorMessage).toBe('Form submission generated error');
    });
  });
});
