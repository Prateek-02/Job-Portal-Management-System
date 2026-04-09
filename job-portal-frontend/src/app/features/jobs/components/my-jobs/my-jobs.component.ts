import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Job } from '../../../../models/job.model';
import { catchError, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-my-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, PaginationComponent],
  templateUrl: './my-jobs.component.html'
})
export class MyJobsComponent implements OnInit, OnDestroy {
  jobs: Job[] = [];
  isLoading = true;
  user: any;

  private destroy$ = new Subject<void>();

  // Pagination
  currentPage = 0;
  pageSize = 8;

  get totalPages(): number {
    return Math.ceil(this.jobs.length / this.pageSize);
  }

  get pagedJobs(): Job[] {
    const start = this.currentPage * this.pageSize;
    return this.jobs.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (this.user && this.user.id) {
      this.loadMyJobs();
    } else {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMyJobs(): void {
    this.isLoading = true;
    this.apiService.getJobsByRecruiter(this.user.id).pipe(
      catchError(() => of([])),
      takeUntil(this.destroy$)
    ).subscribe(jobs => {
      this.jobs = jobs;
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  deleteJob(jobId: number): void {
    if (confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      this.apiService.deleteJob(jobId).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.jobs = this.jobs.filter(j => j.id !== jobId);
          this.cdr.detectChanges();
        },
        error: (err) => alert(err.message || 'Failed to delete job.')
      });
    }
  }

  formatSalary(amount: number | undefined): string {
    if (!amount) return 'N/A';
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}
