import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { ApplicationStatus, JobApplicationResponse } from '../../../../models/application.model';
import { getFriendlyError } from '../../../../core/utils/error-handler.util';

@Component({
  selector: 'app-all-applications',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './all-applications.component.html'
})
export class AllApplicationsComponent implements OnInit {
  applications: JobApplicationResponse[] = [];
  isLoading = true;
  errorMessage = '';
  updatingId: number | null = null;

  readonly statuses: ApplicationStatus[] = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED'];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.apiService.getAllRecruiterApplications().subscribe({
      next: (res) => {
        this.applications = res || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = getFriendlyError(err, 'load_applications');
        this.isLoading = false;
      }
    });
  }

  getCountByStatus(status: ApplicationStatus): number {
    return this.applications.filter(a => a.status === status).length;
  }

  updateStatus(app: JobApplicationResponse, status: ApplicationStatus): void {
    if (app.status === status) return;
    
    this.updatingId = app.id;
    this.apiService.updateApplicationStatus(app.id, status).subscribe({
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
      APPLIED: 'bg-blue-500/10 text-blue-900 border-blue-500/20',
      UNDER_REVIEW: 'bg-yellow-500/10 text-yellow-900 border-yellow-500/20',
      SHORTLISTED: 'bg-green-500/10 text-green-900 border-green-500/20',
      REJECTED: 'bg-red-500/10 text-red-900 border-red-500/20'
    };
    return map[status] || 'bg-gray-500/10 text-gray-900 border-gray-500/20';
  }
}
