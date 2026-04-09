import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Job } from '../../../../models/job.model';
import { catchError, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {
  featuredJobs: Job[] = [];
  isLoadingJobs = true;
  jobsError = false;
  reports: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.isLoadingJobs = true;
    this.jobsError = false;

    this.apiService.getJobs(0, 6).pipe(
      catchError(() => {
        this.jobsError = true;
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => {
        if (res && res.content && res.content.length > 0) {
          this.featuredJobs = res.content;
        } else {
          this.featuredJobs = [];
        }
        this.isLoadingJobs = false;
      }
    });

    this.apiService.getPublicStats().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.reports = res;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatSalary(amount: number): string {
    if (!amount) return 'Competitive';
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}
