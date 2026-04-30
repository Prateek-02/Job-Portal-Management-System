import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Job } from '../../../../models/job.model';
import { catchError, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { getFriendlyError } from '../../../../core/utils/error-handler.util';

@Component({
  selector: 'app-my-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, PaginationComponent, ModalComponent],
  templateUrl: './my-jobs.component.html'
})
export class MyJobsComponent implements OnInit, OnDestroy {
  jobs: Job[] = [];
  isLoading = true;
  user: any;
  showDeleteModal = false;
  jobToDelete: Job | null = null;
  deletingId: number | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  private destroy$ = new Subject<void>();

  // Pagination
  currentPage = 0;
  pageSize = 8;
  totalElements = 0;
  totalPages = 0;

  get pagedJobs(): Job[] {
    return this.jobs;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadMyJobs();
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
    this.apiService.getJobsByRecruiter(this.user.id, this.currentPage, this.pageSize).pipe(
      catchError(() => of(null)),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.jobs = res?.content || [];
      this.totalElements = res?.totalElements || 0;
      this.totalPages = res?.totalPages || 0;
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  confirmDelete(job: Job): void {
    this.jobToDelete = job;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.jobToDelete = null;
  }

  executeDelete(): void {
    if (!this.jobToDelete) return;

    this.deletingId = this.jobToDelete.id!;
    this.apiService.deleteJob(this.jobToDelete.id!).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.jobs = this.jobs.filter(j => j.id !== this.deletingId);
        this.successMessage = 'Job deleted successfully';
        this.deletingId = null;
        this.closeDeleteModal();
        this.cdr.detectChanges();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.errorMessage = getFriendlyError(err, 'delete_job');
        this.deletingId = null;
        this.closeDeleteModal();
        this.cdr.detectChanges();
        setTimeout(() => this.errorMessage = null, 5000);
      }
    });
  }

  formatSalary(amount: number | undefined): string {
    if (!amount) return 'N/A';
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}
