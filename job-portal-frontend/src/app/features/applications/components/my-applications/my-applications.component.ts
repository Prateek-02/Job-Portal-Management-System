import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.css']
})
export class MyApplicationsComponent implements OnInit {
  applications: any[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.getMyApplications().subscribe({
      next: (res) => {
        this.applications = res || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load your applications. Please try again.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'APPLIED':
      case 'PENDING':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'REVIEWING':
      case 'SHORTLISTED':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'ACCEPTED':
      case 'HIRED':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  }
}
