import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-manage-applications',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './manage-applications.component.html',
  styleUrls: ['./manage-applications.component.css']
})
export class ManageApplicationsComponent implements OnInit {
  jobId: string | null = null;
  applications: any[] = [];
  jobDetails: any = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.jobId = params.get('jobId');
      if (this.jobId) {
        this.loadApplications(this.jobId);
        this.loadJobDetails(this.jobId);
      }
    });
  }

  loadJobDetails(id: string): void {
    this.apiService.getJobById(id).subscribe({
      next: (data) => this.jobDetails = data,
      error: () => console.error('Failed to load job details')
    });
  }

  loadApplications(jobId: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.getJobApplications(jobId).subscribe({
      next: (res) => {
        this.applications = res || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to load candidates for this job.';
        this.isLoading = false;
      }
    });
  }

  updateStatus(appId: number, newStatus: string): void {
    this.apiService.updateApplicationStatus(appId, newStatus).subscribe({
      next: (res) => {
        // Update local state to reflect change
        const appInfo = this.applications.find(a => a.id === appId);
        if (appInfo) {
          appInfo.status = newStatus;
        }
      },
      error: (err) => {
        console.error('Status update failed', err);
        alert('Failed to update status.');
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'APPLIED':
      case 'PENDING':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'REVIEWING':
      case 'SHORTLISTED':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'ACCEPTED':
      case 'HIRED':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  }
}
