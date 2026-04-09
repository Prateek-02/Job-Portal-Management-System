import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Job } from '../../../../../../../models/job.model';
import { JobApplicationResponse } from '../../../../../../../models/application.model';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { DashboardPollingService } from '../../../../../../../core/services/dashboard-polling.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-recruiter-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recruiter-stats.component.html'
})
export class RecruiterStatsComponent implements OnInit, OnDestroy {
  myPostedJobs: Job[] = [];
  totalAppsLast7Days = 0;
  appVelocityPoints = '';
  pendingApplications: JobApplicationResponse[] = [];
  recentApplicationsForJobs: JobApplicationResponse[] = [];
  interviewCount = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private pollingService: DashboardPollingService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user && user.id && user.role === 'RECRUITER') {
        this.subscribeToPolling();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToPolling(): void {
    this.pollingService.recruiterData$.pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      if (data.jobs && data.applications) {
        this.myPostedJobs = data.jobs;
        this.recentApplicationsForJobs = data.applications;

        this.calculateAppVelocity(data.applications);
        this.pendingApplications = data.applications.filter((app: any) =>
          app.status === 'APPLIED' || app.status === 'UNDER_REVIEW'
        );
        this.interviewCount = data.applications.filter((app: any) =>
          app.status === 'SHORTLISTED'
        ).length;
      }
    });
  }

  private calculateAppVelocity(allApps: JobApplicationResponse[]): void {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toDateString();
    });

    const dailyCounts = last7Days.map(dayStr => {
      return allApps.filter(app => new Date(app.appliedAt).toDateString() === dayStr).length;
    });

    this.totalAppsLast7Days = dailyCounts.reduce((a, b) => a + b, 0);

    const max = Math.max(...dailyCounts, 1);
    this.appVelocityPoints = dailyCounts.map((count, i) => {
      const x = 10 + (i * 13);
      const y = 35 - (count / max * 25);
      return `${x},${y}`;
    }).join(' ');
  }
}
