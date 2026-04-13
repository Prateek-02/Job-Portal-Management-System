import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { JobListComponent } from './job-list.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { DatePipe } from '@angular/common';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { vi } from 'vitest';

describe('JobListComponent', () => {
  let component: JobListComponent;
  let fixture: ComponentFixture<JobListComponent>;
  let apiServiceMock: any;
  let authServiceMock: any;
  let routerMock: any;
  let queryParamsSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    apiServiceMock = {
      getJobs: vi.fn().mockReturnValue(of({ content: [], totalPages: 0, pageNumber: 0, totalElements: 0 })),
      searchJobs: vi.fn().mockReturnValue(of({ content: [], totalPages: 0, pageNumber: 0, totalElements: 0 }))
    };
    
    authServiceMock = { isAuthenticated: vi.fn() };
    routerMock = { navigate: vi.fn() };
    queryParamsSubject = new BehaviorSubject({});

    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [JobListComponent, ReactiveFormsModule, DatePipe, PaginationComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: { queryParams: queryParamsSubject.asObservable(), snapshot: { queryParams: {} } } }
      ]
    })
    .overrideComponent(JobListComponent, {
      set: { imports: [ReactiveFormsModule, DatePipe], schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(JobListComponent);
    component = fixture.componentInstance;
  }

  describe('Initialization and Params Strategy (Normal / Exception / Boundary)', () => {
    it('should initialize successfully routing normally to generic getJobs if no params exist', () => {
      setupComponent();
      fixture.detectChanges();
      
      expect(apiServiceMock.getJobs).toHaveBeenCalledTimes(1);
      expect(apiServiceMock.getJobs).toHaveBeenCalledWith(0, 9);
      expect(component.selectedSkills).toEqual([]);
    });

    it('should process skill boundary edge queryParam mapping seamlessly and invoke search parameter natively', () => {
      setupComponent();
      // Emulate starting with queryParams
      (component as any).route.snapshot.queryParams = { skill: 'Angular' };
      fixture.detectChanges();
      
      queryParamsSubject.next({ skill: 'Angular' });
      
      expect(component.selectedSkills).toEqual(['Angular']);
      expect(component.activeFilter.skills).toEqual(['Angular']);
      // searchJobs should be invoked instead of standard getJobs
      expect(apiServiceMock.searchJobs).toHaveBeenCalledWith({ skills: ['Angular'] }, 0, 9);
    });

    it('should cleanly fallback to global exception errorMessage if load loadJobs throws explicitly', () => {
      apiServiceMock.getJobs.mockReturnValue(throwError(() => new Error('DB Error')));
      setupComponent();
      fixture.detectChanges();
      
      expect(component.errorMessage).toBe('Failed to load jobs. Please try again.');
    });
  });

  describe('Search and Filtering Processing (Normal / Boundary)', () => {
    it('should trigger search jobs automatically subject to pipe debouncing bounds correctly', fakeAsync(() => {
      setupComponent();
      fixture.detectChanges();
      apiServiceMock.getJobs.mockClear();
      apiServiceMock.searchJobs.mockClear();
      
      component.filterForm.patchValue({ title: 'Engineer' });
      
      // Initially not called
      expect(apiServiceMock.searchJobs).not.toHaveBeenCalled();
      
      tick(500); // Trigger debounce behavior 
      
      expect(apiServiceMock.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Engineer' }), 0, 9
      );
    }));

    it('should map filter clear bounds smoothly discarding all constraints and firing generic load logic strictly', () => {
      setupComponent();
      fixture.detectChanges();
      
      component.filterForm.patchValue({ companyName: 'Google' });
      component.selectedSkills = ['Java'];
      apiServiceMock.getJobs.mockClear();
      apiServiceMock.searchJobs.mockClear();
      
      component.clearFilters();
      
      expect(component.selectedSkills).toEqual([]);
      expect(component.filterForm.value.companyName).toBeNull();
      // Should invoke basic
      expect(apiServiceMock.getJobs).toHaveBeenCalled();
    });

    it('should toggle strings onto skill collection sequentially correctly testing explicit deduplication paths visually', () => {
      setupComponent();
      fixture.detectChanges();
      
      component.toggleSkill('AWS');
      expect(component.selectedSkills).toEqual(['AWS']);
      
      component.toggleSkill('AWS');
      expect(component.selectedSkills).toEqual([]); // Removed
    });
  });

  describe('Pagination and Formatting', () => {
    it('should enforce numeric pages structural mapping and bounds naturally mapping scrolling context', () => {
      setupComponent();
      fixture.detectChanges();
      
      component.totalPages = 5;
      component.goToPage(3);
      
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      
      // Exceed bound
      apiServiceMock.getJobs.mockClear();
      component.goToPage(6);
      expect(apiServiceMock.getJobs).not.toHaveBeenCalled();
    });

    it('should apply boundary scaling safely converting numeric bounds directly for structural representations', () => {
      setupComponent();
      
      expect(component.formatSalary(undefined)).toBe('');
      expect(component.formatSalary(50000)).toBe('₹50,000');
      expect(component.formatSalary(150000)).toBe('₹1.5L');
    });
  });
});
