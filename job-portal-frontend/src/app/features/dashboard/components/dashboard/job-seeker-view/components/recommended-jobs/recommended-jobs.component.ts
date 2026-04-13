import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Job } from '../../../../../../../models/job.model';
import { ApiService } from '../../../../../../../core/services/api.service';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../../../core/services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-recommended-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './recommended-jobs.component.html'
})
export class RecommendedJobsComponent implements OnInit, OnDestroy {
  recentJobs: Job[] = [];
  isLoadingJobs = true;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user && user.id) {
        this.loadRecentJobs(user.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRecentJobs(userId: number): void {
    this.apiService.getJobs(0, 4).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const pageJobs = res.content || [];
        this.recentJobs = pageJobs;
        this.isLoadingJobs = false;
        this.checkNewJobs(userId, pageJobs);
      },
      error: () => this.isLoadingJobs = false
    });
  }

  private checkNewJobs(userId: number, jobs: Job[]): void {
    const seenJobsKey = `jp_seen_jobs_${userId}`;
    const seenJobIds: number[] = JSON.parse(localStorage.getItem(seenJobsKey) || '[]');

    let changed = false;
    jobs.forEach((job: Job) => {
      if (!seenJobIds.includes(job.id)) {
        this.notificationService.push(
          'JOB_POSTED',
          `New Job: ${job.title}`,
          `${job.companyName} is hiring in ${job.location}. Salary: ${this.formatSalary(job.salary)}`,
          `/jobs/${job.id}`
        );
        seenJobIds.push(job.id);
        changed = true;
      }
    });

    if (changed) {
      localStorage.setItem(seenJobsKey, JSON.stringify(seenJobIds));
    }
  }

  formatSalary(amount: number): string {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}
