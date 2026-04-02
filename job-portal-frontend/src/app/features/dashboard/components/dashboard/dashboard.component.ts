import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { NotificationService } from '../../../notifications/services/notification.service';
import { ApplicationResponse, JobApplicationResponse } from '../../../../models/application.model';
import { Job, PageResponse } from '../../../../models/job.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  isLoadingApps = true;
  isLoadingJobs = true;
  user: any = null;
  isRecruiter = false;
  isJobSeeker = false;
  private subs = new Subscription();

  // Job Seeker data
  myApplications: ApplicationResponse[] = [];
  recentJobs: Job[] = [];

  // Recruiter data
  myPostedJobs: Job[] = [];
  recentApplicationsForJobs: JobApplicationResponse[] = [];

  get appliedCount() { return this.myApplications.length; }
  get interviewCount() { return this.myApplications.filter(a => a.status === 'SHORTLISTED').length; }
  get rejectedCount() { return this.myApplications.filter(a => a.status === 'REJECTED').length; }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      APPLIED: 'badge-blue',
      UNDER_REVIEW: 'badge-orange',
      SHORTLISTED: 'badge-green',
      REJECTED: 'badge-red'
    };
    return map[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      APPLIED: 'Applied', UNDER_REVIEW: 'Under Review',
      SHORTLISTED: 'Shortlisted', REJECTED: 'Rejected'
    };
    return map[status] || status;
  }

  formatSalary(amount: number): string {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.isRecruiter = this.authService.isRecruiter();
    this.isJobSeeker = this.authService.isJobSeeker();

    if (this.isJobSeeker) {
      this.loadJobSeekerData();
    } else if (this.isRecruiter) {
      this.loadRecruiterData();
    } else {
      this.isLoadingApps = false;
      this.isLoadingJobs = false;
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private loadJobSeekerData(): void {
    // 1. Fetch Applications Independently
    this.subs.add(
      this.apiService.getMyApplications().pipe(
        catchError(() => of([] as ApplicationResponse[]))
      ).subscribe({
        next: (apps) => {
          const seenKey = `jp_seen_apps_${this.user?.id}`;
          const seenIds: number[] = JSON.parse(localStorage.getItem(seenKey) || '[]');
          
          apps.forEach(app => {
            if (!seenIds.includes(app.id)) {
              const statusMsg: Record<string, string> = {
                SHORTLISTED: `🎉 Great news! Your application for ${app.job.title} at ${app.job.companyName} has been shortlisted.`,
                REJECTED: `Your application for ${app.job.title} at ${app.job.companyName} was not selected. Keep applying!`,
                UNDER_REVIEW: `Your application for ${app.job.title} at ${app.job.companyName} is under review.`,
                APPLIED: `You successfully applied for ${app.job.title} at ${app.job.companyName}.`
              };
              if (statusMsg[app.status]) {
                this.notificationService.push(
                  'APPLICATION_STATUS',
                  `Application ${this.getStatusLabel(app.status)}`,
                  statusMsg[app.status],
                  `/applications/my-applications`
                );
              }
              seenIds.push(app.id);
            }
          });
          localStorage.setItem(seenKey, JSON.stringify(seenIds));

          this.myApplications = apps.slice(0, 5);
          this.isLoadingApps = false;
          this.cdr.detectChanges();
        },
        error: () => { this.isLoadingApps = false; this.cdr.detectChanges(); }
      })
    );

    // 2. Fetch Job Recommendations Independently
    this.subs.add(
      this.apiService.getJobs(0, 6).pipe(
        catchError(() => of({ content: [], totalPages: 0, totalElements: 0, size: 6, number: 0, last: true, first: true, empty: true } as PageResponse<Job>))
      ).subscribe({
        next: (jobsPage) => {
          const pageJobs = jobsPage.content || [];
          const seenJobsKey = `jp_seen_jobs_${this.user?.id}`;
          const seenJobIds: number[] = JSON.parse(localStorage.getItem(seenJobsKey) || '[]');
          
          pageJobs.forEach(job => {
            if (!seenJobIds.includes(job.id)) {
              this.notificationService.push(
                'JOB_POSTED',
                `New Job: ${job.title}`,
                `${job.companyName} is hiring in ${job.location}. Salary: ${this.formatSalary(job.salary)}`,
                `/jobs/${job.id}`
              );
              seenJobIds.push(job.id);
            }
          });
          localStorage.setItem(seenJobsKey, JSON.stringify(seenJobIds));

          this.recentJobs = pageJobs;
          this.isLoadingJobs = false;
          this.cdr.detectChanges();
        },
        error: () => { this.isLoadingJobs = false; this.cdr.detectChanges(); }
      })
    );
  }

  private loadRecruiterData(): void {
    // 1. Fetch First Jobs
    this.subs.add(
      this.apiService.getJobs(0, 10).pipe(
        catchError(() => of({ content: [], totalPages: 0, totalElements: 0, size: 10, number: 0, last: true, first: true, empty: true } as PageResponse<Job>))
      ).subscribe({
        next: (res) => {
          this.myPostedJobs = (res.content || []).slice(0, 6);
          this.isLoadingJobs = false;
          this.cdr.detectChanges();

          if (this.myPostedJobs.length > 0) {
            import('rxjs').then(({ forkJoin, of }) => {
              const appRequests = this.myPostedJobs.map(job =>
                this.apiService.getJobApplications(job.id).pipe(catchError(() => of([])))
              );

              this.subs.add(
                forkJoin(appRequests).subscribe({
                  next: (responses: any[]) => {
                    let allApplications: JobApplicationResponse[] = [];
                    responses.forEach(apps => {
                      if (Array.isArray(apps)) {
                        allApplications = [...allApplications, ...apps];
                      }
                    });

                    // Sort by newest first assuming higher ID means newer, or just take slice
                    allApplications.sort((a, b) => b.id - a.id);

                    const seenKey = `jp_seen_applicants_${this.user?.id}`;
                    const seenIds: number[] = JSON.parse(localStorage.getItem(seenKey) || '[]');
                    
                    allApplications.forEach(app => {
                      if (!seenIds.includes(app.id)) {
                        const relatedJob = this.myPostedJobs.find(j => j.id === app.jobId);
                        this.notificationService.push(
                          'JOB_APPLIED',
                          `New Application Received`,
                          `${app.applicantName} applied for ${relatedJob?.title || 'your target position'}.`,
                          `/applications/manage/${app.jobId}`
                        );
                        seenIds.push(app.id);
                      }
                    });
                    localStorage.setItem(seenKey, JSON.stringify(seenIds));

                    this.recentApplicationsForJobs = allApplications; // Keep them all or slice them. The template maps length and iterates. Let's slice for display if large.
                    this.isLoadingApps = false;
                    this.cdr.detectChanges();
                  },
                  error: () => { this.isLoadingApps = false; this.cdr.detectChanges(); }
                })
              );
            });
          } else {
            this.isLoadingApps = false;
            this.cdr.detectChanges();
          }
        },
        error: () => { this.isLoadingJobs = false; this.isLoadingApps = false; this.cdr.detectChanges(); }
      })
    );
  }

  updateApplicationStatus(appId: number, status: 'SHORTLISTED' | 'REJECTED'): void {
    this.apiService.updateApplicationStatus(appId, status).subscribe({
      next: () => {
        this.recentApplicationsForJobs = this.recentApplicationsForJobs.map(a =>
          a.id === appId ? { ...a, status } : a
        );
        this.cdr.detectChanges();
      }
    });
  }
}
