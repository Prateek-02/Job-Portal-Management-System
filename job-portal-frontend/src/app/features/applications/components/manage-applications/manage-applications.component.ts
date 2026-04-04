import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { Job } from '../../../../models/job.model';
import { ApplicationStatus, JobApplicationResponse } from '../../../../models/application.model';
import { getFriendlyError } from '../../../../core/utils/error-handler.util';

@Component({
  selector: 'app-manage-applications',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './manage-applications.component.html'
})
export class ManageApplicationsComponent implements OnInit {
  jobId!: number;
  job: Job | null = null;
  applications: JobApplicationResponse[] = [];
  isLoading = true;
  errorMessage = '';
  updatingId: number | null = null;

  readonly statuses: ApplicationStatus[] = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED'];

  constructor(private route: ActivatedRoute, private apiService: ApiService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.jobId = Number(params.get('jobId'));
      this.loadData();
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.apiService.getJobById(this.jobId).subscribe({
      next: (j) => this.job = j,
      error: () => {}
    });
    this.apiService.getJobApplications(this.jobId).subscribe({
      next: (res) => { this.applications = res || []; this.isLoading = false; },
      error: (err) => { this.errorMessage = getFriendlyError(err, 'load_applications'); this.isLoading = false; }
    });
  }

  updateStatus(app: JobApplicationResponse, status: ApplicationStatus): void {
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
      APPLIED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      UNDER_REVIEW: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      SHORTLISTED: 'bg-green-500/20 text-green-400 border-green-500/30',
      REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return map[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}
