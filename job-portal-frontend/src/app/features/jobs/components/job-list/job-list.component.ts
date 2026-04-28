import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute, Params } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Job, JobFilter, PageResponse } from '../../../../models/job.model';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe, PaginationComponent],
  templateUrl: './job-list.component.html',
  changeDetection: ChangeDetectionStrategy.Default
})
export class JobListComponent implements OnInit, OnDestroy {
  jobs: Job[] = [];
  isLoading = true;
  errorMessage = '';
  totalPages = 0;
  currentPage = 0;
  pageSize = 9;
  totalElements = 0;

  filterForm!: FormGroup;
  private searchSubject = new Subject<JobFilter>();
  private destroy$ = new Subject<void>();
  activeFilter: JobFilter = {};
  selectedSkills: string[] = [];

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      title: [''],
      location: [''],
      companyName: [''],
      minSalary: [null],
      maxSalary: [null],
      minExperience: [null],
      maxExperience: [null]
    });

    // Handle deep-linked skills from query params
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params: Params) => {
      if (params['skill']) {
        const skill = params['skill'];
        if (!this.selectedSkills.includes(skill)) {
          this.selectedSkills = [skill]; // Start fresh with this skill or add to list? User usually expects just one if coming from a detail page.
          this.activeFilter = this.buildFilter(this.filterForm.value);
          this.loadJobs(0);
        }
      }
    });

    // Debounced search on filter changes
    this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntil(this.destroy$)
    ).subscribe(values => {
      this.activeFilter = this.buildFilter(values);
      this.loadJobs(0);
    });



    // Only load if not already triggered by query params
    if (!this.route.snapshot.queryParams['skill']) {
      this.loadJobs(0);
    }
  }





  private buildFilter(values: any): JobFilter {
    const filter: JobFilter = {};
    if (values.title?.trim()) filter.title = values.title.trim();
    if (values.location?.trim()) filter.location = values.location.trim();
    if (values.companyName?.trim()) filter.companyName = values.companyName.trim();
    if (values.minSalary) filter.minSalary = +values.minSalary;
    if (values.maxSalary) filter.maxSalary = +values.maxSalary;
    if (values.minExperience) filter.minExperience = +values.minExperience;
    if (values.maxExperience) filter.maxExperience = +values.maxExperience;
    if (this.selectedSkills.length > 0) filter.skills = this.selectedSkills;
    return filter;
  }

  loadJobs(page: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    const hasFilter = Object.keys(this.activeFilter).length > 0;
    const request$ = hasFilter
      ? this.apiService.searchJobs(this.activeFilter, page, this.pageSize)
      : this.apiService.getJobs(page, this.pageSize);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: PageResponse<Job>) => {
        this.jobs = res?.content || [];
        this.totalPages = res.totalPages;
        this.currentPage = res.pageNumber;
        this.totalElements = res.totalElements;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load jobs. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.selectedSkills = [];
    this.activeFilter = {};
    this.loadJobs(0);
  }

  toggleSkill(skill: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const index = this.selectedSkills.indexOf(skill);
    if (index > -1) {
      this.selectedSkills.splice(index, 1);
    } else {
      this.selectedSkills.push(skill);
    }
    this.activeFilter = this.buildFilter(this.filterForm.value);
    this.loadJobs(0);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.loadJobs(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  get pages(): number[] {
    const total = Math.min(this.totalPages, 5);
    const start = Math.max(0, this.currentPage - 2);
    return Array.from({ length: total }, (_, i) => start + i).filter(p => p < this.totalPages);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Format salary as INR
  formatSalary(amount: number | undefined): string {
    if (!amount) return '';
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}
