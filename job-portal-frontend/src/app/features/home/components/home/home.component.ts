import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Job, PageResponse } from '../../../../models/job.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  featuredJobs: Job[] = [];
  isLoadingJobs = true;
  searchControl = new FormControl('');

  stats = { jobs: 0, companies: 0, seekers: 0 };

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Authenticated users go straight to the jobs dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    
    // Guests see the landing page — Load some jobs to display
    this.isLoadingJobs = true;
    this.apiService.getJobs(0, 6).subscribe({
      next: (res) => {
        this.featuredJobs = res.content || [];
        this.isLoadingJobs = false;
      },
      error: () => {
        this.isLoadingJobs = false;
      }
    });
  }

  search(): void {
    const q = this.searchControl.value?.trim();
    if (q) {
      this.router.navigate(['/jobs'], { queryParams: { title: q } });
    } else {
      this.router.navigate(['/jobs']);
    }
  }

  // Format salary as INR
  formatSalary(amount: number): string {
    if (!amount) return '';
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}
