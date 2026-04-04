import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Job } from '../../../../models/job.model';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-my-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './my-jobs.component.html'
})
export class MyJobsComponent implements OnInit {
  jobs: Job[] = [];
  isLoading = true;
  user: any;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (this.user && this.user.id) {
      this.loadMyJobs();
    } else {
      this.isLoading = false;
    }
  }

  loadMyJobs(): void {
    this.isLoading = true;
    this.apiService.getJobsByRecruiter(this.user.id).pipe(
      catchError(() => of([]))
    ).subscribe(jobs => {
      this.jobs = jobs;
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  deleteJob(jobId: number): void {
    if (confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      this.apiService.deleteJob(jobId).subscribe({
        next: () => {
          this.jobs = this.jobs.filter(j => j.id !== jobId);
          this.cdr.detectChanges();
        },
        error: (err) => alert(err.message || 'Failed to delete job.')
      });
    }
  }

  formatSalary(amount: number | undefined): string {
    if (!amount) return 'N/A';
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}
