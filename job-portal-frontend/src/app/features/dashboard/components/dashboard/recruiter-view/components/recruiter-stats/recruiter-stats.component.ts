import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Job } from '../../../../../../../models/job.model';
import { JobApplicationResponse } from '../../../../../../../models/application.model';
import { ApiService } from '../../../../../../../core/services/api.service';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-recruiter-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recruiter-stats.component.html'
})
export class RecruiterStatsComponent implements OnInit {
  myPostedJobs: Job[] = [];
  totalAppsLast7Days = 0;
  appVelocityPoints = '';
  pendingApplications: JobApplicationResponse[] = [];
  recentApplicationsForJobs: JobApplicationResponse[] = [];
  interviewCount = 0;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.id) {
        this.loadStats(user.id);
      }
    });
  }

  private loadStats(userId: number): void {
    this.apiService.getJobsByRecruiter(userId).pipe(
      catchError(() => of([]))
    ).subscribe(jobs => {
      this.myPostedJobs = jobs;
      if (jobs.length > 0) {
        const appRequests = jobs.map(job =>
          this.apiService.getJobApplications(job.id).pipe(catchError(() => of([])))
        );

        forkJoin(appRequests).subscribe(responses => {
          let allApplications: JobApplicationResponse[] = [];
          responses.forEach(apps => {
            if (Array.isArray(apps)) {
              allApplications = [...allApplications, ...apps];
            }
          });

          this.calculateAppVelocity(allApplications);
          this.recentApplicationsForJobs = allApplications;
          this.pendingApplications = allApplications.filter(app => app.status === 'APPLIED' || app.status === 'UNDER_REVIEW');
          this.interviewCount = allApplications.filter(app => app.status === 'SHORTLISTED').length;
        });
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
