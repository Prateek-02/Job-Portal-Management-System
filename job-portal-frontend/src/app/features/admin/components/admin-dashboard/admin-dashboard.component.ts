import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  reports: any = null;
  users: any[] = [];
  jobs: any = null;

  isLoadingStats = true;
  isLoadingUsers = true;
  isLoadingJobs = true;

  activeTab = 'stats'; // 'stats', 'users', 'jobs'

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
    this.loadJobs();
  }

  loadStats(): void {
    this.isLoadingStats = true;
    this.apiService.getAdminReports().subscribe({
      next: (data) => {
        this.reports = data;
        this.isLoadingStats = false;
      },
      error: (err) => {
        console.error('Failed to load reports', err);
        this.isLoadingStats = false;
      }
    });
  }

  loadUsers(): void {
    this.isLoadingUsers = true;
    this.apiService.getAdminUsers().subscribe({
      next: (data) => {
        this.users = data || [];
        this.isLoadingUsers = false;
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.isLoadingUsers = false;
      }
    });
  }

  loadJobs(): void {
    this.isLoadingJobs = true;
    this.apiService.getAdminJobs().subscribe({
      next: (data) => {
        // Handle pagination if admin jobs return paged response
        this.jobs = data?.content || data || [];
        this.isLoadingJobs = false;
      },
      error: (err) => {
        console.error('Failed to load jobs', err);
        this.isLoadingJobs = false;
      }
    });
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user? This will also delete all their associated data.')) {
      this.apiService.deleteUser(id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== id);
          this.loadStats(); // Refresh stats
        },
        error: (err) => {
          alert('Failed to delete user.');
        }
      });
    }
  }

  deleteJob(id: number): void {
    if (confirm('Are you sure you want to delete this job?')) {
      this.apiService.deleteJob(id).subscribe({
        next: () => {
          this.jobs = this.jobs.filter((j: any) => j.id !== id);
          this.loadStats(); // Refresh stats
        },
        error: (err) => {
          alert('Failed to delete job.');
        }
      });
    }
  }
}
