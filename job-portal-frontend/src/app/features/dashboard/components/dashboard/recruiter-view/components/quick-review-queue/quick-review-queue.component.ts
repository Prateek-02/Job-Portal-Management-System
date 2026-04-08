import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { JobApplicationResponse } from '../../../../../../../models/application.model';
import { ApiService } from '../../../../../../../core/services/api.service';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-quick-review-queue',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './quick-review-queue.component.html'
})
export class QuickReviewQueueComponent implements OnInit {
  pendingApplications: JobApplicationResponse[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.id) {
        this.loadPendingApplications(user.id);
      }
    });
  }

  private loadPendingApplications(userId: number): void {
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

          // Sort by ID descending (recent first) and filter by APPLIED/UNDER_REVIEW
          this.pendingApplications = allApplications
            .filter(app => app.status === 'APPLIED' || app.status === 'UNDER_REVIEW')
            .sort((a, b) => b.id - a.id);
          
          this.cdr.detectChanges();
        });
      }
    });
  }

  onUpdateStatus(app: JobApplicationResponse, status: 'SHORTLISTED' | 'REJECTED'): void {
    this.apiService.updateApplicationStatus(app.id, status).subscribe({
      next: () => {
        // Remove locally with a small animation delay if needed, 
        // but for now just immediate filter
        this.pendingApplications = this.pendingApplications.filter(a => a.id !== app.id);
        this.cdr.detectChanges();
      }
    });
  }
}
