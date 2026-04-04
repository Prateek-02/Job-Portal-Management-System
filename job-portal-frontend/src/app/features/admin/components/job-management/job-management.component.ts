import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { AdminJobResponse } from '../../../../models/api-response.model';
import { getFriendlyError } from '../../../../core/utils/error-handler.util';

@Component({
  selector: 'app-job-management',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './job-management.component.html'
})
export class JobManagementComponent implements OnInit {
  jobs: AdminJobResponse[] = [];
  isLoading = true;
  deletingId: number | null = null;
  errorMessage = '';
  totalPages = 0;
  totalElements = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getAdminJobs().subscribe({
      next: (data) => {
        this.jobs = data.content || [];
        this.totalPages = data.totalPages;
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
}
