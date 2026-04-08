import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JobApplicationResponse } from '../../../../../../../models/application.model';
import { ApiService } from '../../../../../../../core/services/api.service';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../../notifications/services/notification.service';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-recent-candidates-table',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './recent-candidates-table.component.html'
})
export class RecentCandidatesTableComponent implements OnInit {
  recentApplicationsForJobs: JobApplicationResponse[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.id) {
        this.loadRecentCandidates(user.id);
      }
    });
  }

  private loadRecentCandidates(userId: number): void {
    this.apiService.getJobsByRecruiter(userId).pipe(
      catchError(() => of([]))
    ).subscribe(jobs => {
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

          // Sort by ID descending and slice
          this.recentApplicationsForJobs = allApplications
            .sort((a, b) => b.id - a.id)
            .slice(0, 5);

          // Map Job Titles (assuming they aren't already included or need verification)
          this.recentApplicationsForJobs.forEach(app => {
            const relatedJob = jobs.find(j => j.id === app.jobId);
            if (relatedJob) {
              app.jobTitle = relatedJob.title;
              app.companyName = relatedJob.companyName;
            }
          });

          this.checkNewApplicants(userId, this.recentApplicationsForJobs);
          this.cdr.detectChanges();
        });
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
