import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { Job } from '../../../../models/job.model';
import { ApplicationStatus, JobApplicationResponse } from '../../../../models/application.model';
import { getFriendlyError } from '../../../../core/utils/error-handler.util';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-manage-applications',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, PaginationComponent],
  templateUrl: './manage-applications.component.html'
})
export class ManageApplicationsComponent implements OnInit, OnDestroy {
  jobId!: number;
  job: Job | null = null;
  applications: JobApplicationResponse[] = [];
  isLoading = true;
  errorMessage = '';
  updatingId: number | null = null;

  readonly statuses: ApplicationStatus[] = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED'];

  private destroy$ = new Subject<void>();

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  get pagedApplications(): JobApplicationResponse[] {
    return this.applications;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadApplications();
  }

  constructor(private route: ActivatedRoute, private apiService: ApiService) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.jobId = Number(params.get('jobId'));
      this.currentPage = 0;
      this.loadJob();
      this.loadApplications();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadJob(): void {
    this.apiService.getJobById(this.jobId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (j) => this.job = j,
      error: () => {}
    });
  }

  loadApplications(): void {
    this.isLoading = true;
    this.apiService.getJobApplications(this.jobId, this.currentPage, this.pageSize).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { 
        this.applications = res?.content || []; 
        this.totalElements = res?.totalElements || 0;
        this.totalPages = res?.totalPages || 0;
        this.isLoading = false; 
      },
      error: (err) => { this.errorMessage = getFriendlyError(err, 'load_applications'); this.isLoading = false; }
    });
  }

  updateStatus(app: JobApplicationResponse, status: ApplicationStatus): void {
    this.updatingId = app.id;
    this.apiService.updateApplicationStatus(app.id, status).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        app.status = updated.status;
        this.updatingId = null;
      },
      error: (err) => {
        this.updatingId = null;
        alert(getFriendlyError(err, 'update_status'));
      }
    });
  }

  statusClass(status: ApplicationStatus): string {
    const map: Record<ApplicationStatus, string> = {
      APPLIED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      UNDER_REVIEW: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      SHORTLISTED: 'bg-green-500/20 text-green-400 border-green-500/30',
      REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return map[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }

  isStatusReachable(current: string, next: string): boolean {
    if (current === next) return true;
    if (current === 'REJECTED') return false;
    if (next === 'REJECTED') return true;

    if (current === 'APPLIED') return next === 'UNDER_REVIEW';
    if (current === 'UNDER_REVIEW') return next === 'SHORTLISTED';

    return false;
  }
}
