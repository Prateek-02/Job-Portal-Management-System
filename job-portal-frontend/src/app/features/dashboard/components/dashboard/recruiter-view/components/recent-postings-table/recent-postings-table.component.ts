import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Job } from '../../../../../../../models/job.model';
import { ApiService } from '../../../../../../../core/services/api.service';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { DashboardPollingService } from '../../../../../../../core/services/dashboard-polling.service';

@Component({
  selector: 'app-recent-postings-table',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './recent-postings-table.component.html'
})
export class RecentPostingsTableComponent implements OnInit {
  myPostedJobs: Job[] = [];

  constructor(
    private apiService: ApiService,
    private pollingService: DashboardPollingService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.id && user.role === 'RECRUITER') {
        this.subscribeToPolling();
      }
    });
  }

  private subscribeToPolling(): void {
    this.pollingService.recruiterData$.subscribe((data: any) => {
      if (data.jobs) {
        this.myPostedJobs = [...data.jobs].slice(0, 5);
        this.cdr.detectChanges();
      }
    });
  }

  onDelete(jobId: number): void {
    if (confirm('Are you sure you want to delete this job? All associated applications will also be deleted.')) {
      this.apiService.deleteJob(jobId).subscribe({
        next: () => {
          this.myPostedJobs = this.myPostedJobs.filter(j => j.id !== jobId);
          this.cdr.detectChanges();
        },
        error: (err: any) => alert(err.message || 'Failed to delete job.')
      });
    }
  }
}
