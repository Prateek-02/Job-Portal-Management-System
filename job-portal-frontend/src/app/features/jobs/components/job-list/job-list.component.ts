import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Job, JobFilter, PageResponse } from '../../../../models/job.model';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
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
  private activeFilter: JobFilter = {};

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

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

    // Debounced search on filter changes
    this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntil(this.destroy$)
    ).subscribe(values => {
      this.activeFilter = this.buildFilter(values);
      this.loadJobs(0);
    });

    this.loadJobs(0);
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
        this.jobs = res.content || [];
        this.totalPages = res.totalPages;
        this.currentPage = res.number;
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
    this.activeFilter = {};
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
