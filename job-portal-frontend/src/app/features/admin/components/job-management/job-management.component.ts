import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { AdminJobResponse } from '../../../../models/api-response.model';
import { getFriendlyError } from '../../../../core/utils/error-handler.util';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-job-management',
  standalone: true,
  imports: [CommonModule, DatePipe, PaginationComponent, ModalComponent],
  templateUrl: './job-management.component.html'
})
export class JobManagementComponent implements OnInit, OnDestroy {
  jobs: AdminJobResponse[] = [];
  isLoading = true;
  deletingId: number | null = null;
  errorMessage = '';
  successMessage = '';
  showDeleteModal = false;
  jobToDelete: AdminJobResponse | null = null;
  totalElements = 0;
  companyFilter = '';

  private destroy$ = new Subject<void>();

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;

  get pagedJobs(): AdminJobResponse[] {
    return this.jobs;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadJobs();
  }

  onFilterChange(value: string): void {
    this.companyFilter = value;
    this.currentPage = 0;
    this.loadJobs();
  }

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading = true;
    
    const request$ = this.companyFilter.trim()
      ? this.apiService.searchAdminJobs({ companyName: this.companyFilter.trim() }, this.currentPage, this.pageSize)
      : this.apiService.getAdminJobs(this.currentPage, this.pageSize);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.jobs = data?.content || [];
        this.totalElements = data?.totalElements || 0;
        this.totalPages = data?.totalPages || 0;
        this.isLoading = false;
      },
      error: (err) => { this.errorMessage = getFriendlyError(err, 'load_jobs'); this.isLoading = false; }
    });
  }

  confirmDelete(job: AdminJobResponse): void {
    this.jobToDelete = job;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.jobToDelete = null;
  }

  executeDelete(): void {
    if (!this.jobToDelete) return;
    
    const id = this.jobToDelete.id;
    this.deletingId = id;
    this.showDeleteModal = false;
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.deleteJob(id).subscribe({
      next: () => { 
        this.jobs = this.jobs.filter(j => j.id !== id); 
        this.deletingId = null;
        this.successMessage = 'Job deleted successfully';
        this.jobToDelete = null;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => { 
        this.deletingId = null; 
        this.errorMessage = getFriendlyError(err, 'delete_job');
        this.jobToDelete = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
