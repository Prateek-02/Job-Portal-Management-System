import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationResponse } from '../../../../../../../models/application.model';
import { ApiService } from '../../../../../../../core/services/api.service';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../../notifications/services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-job-seeker-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-seeker-stats.component.html'
})
export class JobSeekerStatsComponent implements OnInit, OnDestroy {
  myApplications: ApplicationResponse[] = [];
  appliedCount = 0;
  interviewCount = 0;
  rejectedCount = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user && user.id) {
        this.loadStats(user.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStats(userId: number): void {
    this.apiService.getMyApplications().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      const apps: ApplicationResponse[] = res?.content || [];
      this.myApplications = apps;
      this.appliedCount = res?.totalElements || 0;
      this.interviewCount = apps.filter(a => a.status === 'SHORTLISTED').length;
      this.rejectedCount = apps.filter(a => a.status === 'REJECTED').length;
      this.checkStatusChanges(userId, apps);
    });
  }

  private checkStatusChanges(userId: number, apps: ApplicationResponse[]): void {
    const metadataKey = `jp_app_metadata_${userId}`;
    const appMetadata: Record<number, string> = JSON.parse(localStorage.getItem(metadataKey) || '{}');

    let changed = false;
    apps.forEach((app: ApplicationResponse) => {
      const lastStatus = appMetadata[app.id];

      if (lastStatus === undefined || lastStatus !== app.status) {
        const statusMsg: Record<string, string> = {
          SHORTLISTED: `🎉 Great news! Your application for ${app.job.title} at ${app.job.companyName} has been shortlisted.`,
          REJECTED: `Your application for ${app.job.title} at ${app.job.companyName} was not selected. Keep applying!`,
          UNDER_REVIEW: `Your application for ${app.job.title} at ${app.job.companyName} is under review.`,
          APPLIED: `You successfully applied for ${app.job.title} at ${app.job.companyName}.`
        };

        if (statusMsg[app.status]) {
          const isFirstSeen = lastStatus === undefined;
          const statusLabels: Record<string, string> = {
            APPLIED: 'Applied', UNDER_REVIEW: 'Under Review',
            SHORTLISTED: 'Shortlisted', REJECTED: 'Rejected'
          };
          const title = isFirstSeen ? 'Application Submitted' : `Application ${statusLabels[app.status] || app.status}`;

          this.notificationService.push(
            'APPLICATION_STATUS',
            title,
            statusMsg[app.status],
            `/applications/my-applications`
          );
        }
        appMetadata[app.id] = app.status;
        changed = true;
      }
    });

    if (changed) {
      localStorage.setItem(metadataKey, JSON.stringify(appMetadata));
    }
  }
}
