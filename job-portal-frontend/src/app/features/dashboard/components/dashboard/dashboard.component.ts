import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription, of, forkJoin } from 'rxjs';
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

  // Market Insights (Real Data)
  salaryTrendPoints = '10,25 30,15 50,22 70,10 90,20';
  marketDemandPoints = '10,15 30,22 50,10 70,25 90,15';
  marketStats: any = null;
  topSkills: any[] = [];

  // Recruiter data
  myPostedJobs: Job[] = [];
  allRecruiterApplications: JobApplicationResponse[] = []; // Full list for stats
  recentApplicationsForJobs: JobApplicationResponse[] = [];
  pendingApplications: JobApplicationResponse[] = []; // For Quick Review Deck
  appVelocityPoints: string = '10,35 30,35 50,35 70,35 90,35'; // Initial flat sparkline
  totalAppsLast7Days: number = 0;

  get appliedCount() { return this.myApplications.length; }
  get interviewCount() {
    const source = this.authService.isRecruiter() ? this.allRecruiterApplications : this.myApplications;
    return source.filter(a => a.status === 'SHORTLISTED').length;
  }
  get rejectedCount() { return this.myApplications.filter(a => a.status === 'REJECTED').length; }

  // Activity Feed (Latest 4 notifications)
  get recentActivity() {
    return this.notificationService.all.slice(0, 4);
  }

  get uniqueCandidatesCount() {
    return new Set(this.allRecruiterApplications.map(a => a.userId)).size;
  }

  private mapTrendToPoints(data: number[], width = 100, height = 40): string {
    if (!data || data.length === 0) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    return data.map((val, i) => {
      const x = (i * width) / (data.length - 1);
      const y = height - ((val - min) * height) / range;
      // Clamp Y to prevent overflow (extra padding)
      const clampedY = Math.max(5, Math.min(height - 5, y));
      return `${Math.round(x)},${Math.round(clampedY)}`;
    }).join(' ');
  }

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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.isRecruiter = this.authService.isRecruiter();
    this.isJobSeeker = this.authService.isJobSeeker();

    if (this.isJobSeeker) {
      this.loadJobSeekerData();
    } else if (this.isRecruiter) {
      this.loadRecruiterData();
    } else if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/dashboard']);
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
        next: (apps: ApplicationResponse[]) => {
          const seenKey = `jp_seen_apps_${this.user?.id}`;
          const seenIds: number[] = JSON.parse(localStorage.getItem(seenKey) || '[]');
          
          apps.forEach((app: ApplicationResponse) => {
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
        next: (jobsPage: PageResponse<Job>) => {
          const pageJobs = jobsPage.content || [];
          const seenJobsKey = `jp_seen_jobs_${this.user?.id}`;
          const seenJobIds: number[] = JSON.parse(localStorage.getItem(seenJobsKey) || '[]');
          
          pageJobs.forEach((job: Job) => {
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

    // 3. Fetch Market Pulse Stats
    this.loadMarketStats();
  }

  private loadRecruiterData(): void {
    // Fetch recruiter's jobs first, then applications in parallel
    this.subs.add(
      this.apiService.getJobs(0, 10).pipe(
        catchError(() => of({ content: [], totalPages: 0, totalElements: 0, size: 10, number: 0, last: true, first: true, empty: true } as PageResponse<Job>))
      ).subscribe({
        next: (res: PageResponse<Job>) => {
          this.myPostedJobs = (res.content || []).slice(0, 6);
          this.isLoadingJobs = false;
          this.cdr.detectChanges();

          if (this.myPostedJobs.length > 0) {
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

                  allApplications.sort((a, b) => b.id - a.id);

                  const seenKey = `jp_seen_applicants_${this.user?.id}`;
                  const seenIds: number[] = JSON.parse(localStorage.getItem(seenKey) || '[]');

                  allApplications.forEach(app => {
                    const relatedJob = this.myPostedJobs.find(j => j.id === app.jobId);
                    if (relatedJob) {
                      app.jobTitle = relatedJob.title;
                      app.companyName = relatedJob.companyName;
                    }
                    if (!seenIds.includes(app.id)) {
                      this.notificationService.push(
                        'JOB_APPLIED',
                        `New Application Received`,
                        `${app.applicantName} applied for ${app.jobTitle || 'your job posting'}.`,
                        `/applications/job/${app.jobId}`
                      );
                      seenIds.push(app.id);
                    }
                  });
                  localStorage.setItem(seenKey, JSON.stringify(seenIds));

                  this.allRecruiterApplications = allApplications;
                  this.recentApplicationsForJobs = allApplications.slice(0, 5);
                  this.calculateAppVelocity(allApplications);
                  this.pendingApplications = allApplications.filter(app => app.status === 'APPLIED');
                  this.isLoadingApps = false;
                  this.cdr.detectChanges();
                },
                error: () => { this.isLoadingApps = false; this.cdr.detectChanges(); }
              })
            );
          } else {
            this.isLoadingApps = false;
            this.cdr.detectChanges();
          }
        },
        error: () => { this.isLoadingJobs = false; this.isLoadingApps = false; this.cdr.detectChanges(); }
      })
    );
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
      const x = 10 + (i * 13); // Distributed along 100px width
      const y = 35 - (count / max * 25); // Invert for SVG Y (0 is top)
      return `${x},${y}`;
    }).join(' ');
  }

  updateQuickStatus(app: JobApplicationResponse, status: 'SHORTLISTED' | 'REJECTED'): void {
    this.apiService.updateApplicationStatus(app.id, status).subscribe({
      next: () => {
        // Remove from deck with animation delay
        this.pendingApplications = this.pendingApplications.filter(a => a.id !== app.id);
        this.recentApplicationsForJobs = this.recentApplicationsForJobs.map(a =>
          a.id === app.id ? { ...a, status } : a
        );
        this.cdr.detectChanges();
      }
    });
  }

  // Helper to fetch market stats (used in loadJobSeekerData)
  private loadMarketStats(): void {
    this.subs.add(
      this.apiService.getMarketPulseStats().pipe(
        catchError(() => of(null))
      ).subscribe((stats: any) => {
        if (stats) {
          this.marketStats = stats;
          this.topSkills = stats.topSkills || [];
          this.salaryTrendPoints = this.mapTrendToPoints(stats.salaryTrend);
          this.marketDemandPoints = this.mapTrendToPoints(stats.demandTrend);
          this.cdr.detectChanges();
        }
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

  deleteJob(jobId: number): void {
    if (confirm('Are you sure you want to delete this job? All associated applications will also be deleted.')) {
      this.apiService.deleteJob(jobId).subscribe({
        next: () => {
          this.myPostedJobs = this.myPostedJobs.filter(j => j.id !== jobId);
          this.recentApplicationsForJobs = this.recentApplicationsForJobs.filter(a => a.jobId !== jobId);
          this.cdr.detectChanges();
        },
        error: (err: any) => alert(err.message || 'Failed to delete job.')
      });
    }
  }
}
