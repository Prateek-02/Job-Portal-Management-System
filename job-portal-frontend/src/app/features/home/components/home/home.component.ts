import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Job } from '../../../../models/job.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  featuredJobs: Job[] = [];
  isLoadingJobs = true;
  jobsError = false;
  reports: any = null;

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

    // Fetch featured jobs
    this.apiService.getJobs(0, 6).pipe(
      catchError(() => {
        this.jobsError = true;
        return of(null);
      })
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

    // Fetch real metrics for landing page
    this.apiService.getPublicStats().subscribe({
      next: (res) => {
        this.reports = res;
      }
    });
  }

  formatSalary(amount: number): string {
    if (!amount) return 'Competitive';
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}
