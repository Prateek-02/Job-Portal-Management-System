import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Job } from '../../../../../../../models/job.model';
import { ApiService } from '../../../../../../../core/services/api.service';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { DashboardPollingService } from '../../../../../../../core/services/dashboard-polling.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModalComponent } from '../../../../../../../shared/components/modal/modal.component';
import { getFriendlyError } from '../../../../../../../core/utils/error-handler.util';

@Component({
  selector: 'app-recent-postings-table',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, ModalComponent],
  templateUrl: './recent-postings-table.component.html'
})
export class RecentPostingsTableComponent implements OnInit, OnDestroy {
  myPostedJobs: Job[] = [];
  showDeleteModal = false;
  jobToDelete: Job | null = null;
  deletingId: number | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private pollingService: DashboardPollingService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
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
      if (data.jobs) {
        this.myPostedJobs = [...data.jobs].slice(0, 5);
        this.cdr.detectChanges();
      }
    });
  }

  confirmDelete(job: Job): void {
    this.jobToDelete = job;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.jobToDelete = null;
  }

  executeDelete(): void {
    if (!this.jobToDelete) return;

    this.deletingId = this.jobToDelete.id!;
    this.apiService.deleteJob(this.jobToDelete.id!).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.myPostedJobs = this.myPostedJobs.filter(j => j.id !== this.deletingId);
        this.successMessage = 'Job deleted successfully';
        this.deletingId = null;
        this.closeDeleteModal();
        this.cdr.detectChanges();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.errorMessage = getFriendlyError(err, 'delete_job');
        this.deletingId = null;
        this.closeDeleteModal();
        this.cdr.detectChanges();
        setTimeout(() => this.errorMessage = null, 5000);
      }
    });
  }
}
