import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { JobApplicationResponse } from '../../../../../../../models/application.model';
import { ApiService } from '../../../../../../../core/services/api.service';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { forkJoin, catchError, of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-quick-review-queue',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './quick-review-queue.component.html'
})
export class QuickReviewQueueComponent implements OnInit, OnDestroy {
  pendingApplications: JobApplicationResponse[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user && user.id) {
        this.loadPendingApplications(user.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPendingApplications(userId: number): void {
    this.apiService.getJobsByRecruiter(userId).pipe(
      catchError(() => of(null)),
      takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      const jobs = res?.content || [];
      if (jobs.length > 0) {
        const appRequests = jobs.map((job: any) =>
          this.apiService.getJobApplications(job.id).pipe(catchError(() => of(null)))
        );

        forkJoin(appRequests).pipe(takeUntil(this.destroy$)).subscribe((responses: any) => {
          let allApplications: JobApplicationResponse[] = [];
          responses.forEach((pageObj: any) => {
            const apps = pageObj?.content || [];
            if (Array.isArray(apps)) {
              allApplications = [...allApplications, ...apps];
            }
          });

          this.pendingApplications = allApplications
            .filter(app => app.status === 'APPLIED' || app.status === 'UNDER_REVIEW')
            .sort((a, b) => b.id - a.id);

          this.cdr.detectChanges();
        });
      }
    });
  }

  onUpdateStatus(app: JobApplicationResponse, status: 'SHORTLISTED' | 'REJECTED'): void {
    this.apiService.updateApplicationStatus(app.id, status).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.pendingApplications = this.pendingApplications.filter(a => a.id !== app.id);
        this.cdr.detectChanges();
      }
    });
  }
}
