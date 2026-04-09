import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JobApplicationResponse } from '../../../../../../../models/application.model';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../../notifications/services/notification.service';
import { DashboardPollingService } from '../../../../../../../core/services/dashboard-polling.service';

@Component({
  selector: 'app-recent-candidates-table',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './recent-candidates-table.component.html'
})
export class RecentCandidatesTableComponent implements OnInit {
  recentApplicationsForJobs: JobApplicationResponse[] = [];

  constructor(
    private pollingService: DashboardPollingService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.id && user.role === 'RECRUITER') {
        this.subscribeToPolling(user.id);
      }
    });
  }

  private subscribeToPolling(userId: number): void {
    this.pollingService.recruiterData$.subscribe((data: any) => {
      if (data.applications) {
        // Sort by ID descending and slice the top 5
        this.recentApplicationsForJobs = [...data.applications]
          .sort((a, b) => b.id - a.id)
          .slice(0, 5);

        this.checkNewApplicants(userId, data.applications);
        this.cdr.detectChanges();
      }
    });
  }

  private checkNewApplicants(userId: number, allApplications: JobApplicationResponse[]): void {
    const seenKey = `jp_seen_applicants_${userId}`;
    const seenIds: number[] = JSON.parse(localStorage.getItem(seenKey) || '[]');
    let changed = false;

    allApplications.forEach(app => {
      if (!seenIds.includes(app.id)) {
        this.notificationService.push(
          'JOB_APPLIED',
          `New Application Received`,
          `${app.applicantName} applied for ${app.jobTitle || 'your job posting'}.`,
          `/applications/job/${app.jobId}`
        );
        seenIds.push(app.id);
        changed = true;
      }
    });

    if (changed) {
      localStorage.setItem(seenKey, JSON.stringify(seenIds));
    }
  }
}
