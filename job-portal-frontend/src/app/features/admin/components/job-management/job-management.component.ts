import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { AdminJobResponse } from '../../../../models/api-response.model';
import { getFriendlyError } from '../../../../core/utils/error-handler.util';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-job-management',
  standalone: true,
  imports: [CommonModule, DatePipe, PaginationComponent],
  templateUrl: './job-management.component.html'
})
export class JobManagementComponent implements OnInit, OnDestroy {
  jobs: AdminJobResponse[] = [];
  isLoading = true;
  deletingId: number | null = null;
  errorMessage = '';
  totalElements = 0;

  private destroy$ = new Subject<void>();

  // Pagination
  currentPage = 0;
  pageSize = 10;

  get totalPages(): number {
    return Math.ceil(this.jobs.length / this.pageSize);
  }

  get pagedJobs(): AdminJobResponse[] {
    const start = this.currentPage * this.pageSize;
    return this.jobs.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getAdminJobs().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.jobs = data.content || [];
        this.totalElements = data.totalElements;
        this.isLoading = false;
      },
      error: (err) => { this.errorMessage = getFriendlyError(err, 'load_jobs'); this.isLoading = false; }
    });
  }

  deleteJob(id: number): void {
    if (!confirm('Delete this job and all its applications? This cannot be undone.')) return;
    this.deletingId = id;
    this.apiService.deleteJob(id).subscribe({
      next: () => { this.jobs = this.jobs.filter(j => j.id !== id); this.deletingId = null; },
      error: (err) => { this.deletingId = null; alert(getFriendlyError(err, 'delete_job')); }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
