import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ApplicationResponse, ApplicationStatus } from '../../../../models/application.model';
import { getFriendlyError } from '../../../../core/utils/error-handler.util';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, PaginationComponent],
  templateUrl: './my-applications.component.html'
})
export class MyApplicationsComponent implements OnInit, OnDestroy {
  applications: ApplicationResponse[] = [];
  isLoading = true;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  // Pagination
  currentPage = 0;
  pageSize = 5;
  totalElements = 0;
  totalPages = 0;

  get pagedApplications(): ApplicationResponse[] {
    return this.applications;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadApplications();
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading = true;
    this.apiService.getMyApplications(this.currentPage, this.pageSize).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.applications = res?.content || [];
        this.totalElements = res?.totalElements || 0;
        this.totalPages = res?.totalPages || 0;
        this.isLoading = false;
        this.checkStatuses(this.applications);
      },
      error: (err) => { this.errorMessage = getFriendlyError(err, 'load_applications'); this.isLoading = false; }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkStatuses(apps: ApplicationResponse[]): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) return;

    const metadataKey = `jp_app_metadata_${user.id}`;
    const appMetadata: Record<number, string> = JSON.parse(localStorage.getItem(metadataKey) || '{}');

    let changed = false;
    apps.forEach(app => {
      if (appMetadata[app.id] !== app.status) {
        appMetadata[app.id] = app.status;
        changed = true;
      }
    });

    if (changed) {
      localStorage.setItem(metadataKey, JSON.stringify(appMetadata));
    }
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

  statusLabel(status: ApplicationStatus): string {
    return status?.replace('_', ' ') || 'APPLIED';
  }
}
