import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { AdminUserResponse } from '../../../../models/api-response.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit {
  users: AdminUserResponse[] = [];
  isLoading = true;
  deletingId: number | null = null;
  errorMessage = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getAdminUsers().subscribe({
      next: (data) => { this.users = data || []; this.isLoading = false; },
      error: (err) => { this.errorMessage = err.message || 'Failed to load users.'; this.isLoading = false; }
    });
  }

  deleteUser(id: number): void {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    this.deletingId = id;
    this.apiService.deleteUser(id).subscribe({
      next: () => { this.users = this.users.filter(u => u.id !== id); this.deletingId = null; },
      error: (err) => { this.deletingId = null; alert(err.message || 'Failed to delete user.'); }
    });
  }

  roleClass(role: string): string {
    const map: Record<string, string> = {
      ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
      RECRUITER: 'bg-secondary-500/20 text-secondary-400 border-secondary-500/30',
      JOB_SEEKER: 'bg-primary-500/20 text-primary-400 border-primary-500/30'
    };
    return map[role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}
