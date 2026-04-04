import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { AdminUserResponse } from '../../../../models/api-response.model';
import { getFriendlyError } from '../../../../core/utils/error-handler.util';

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

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.apiService.getAdminUsers().subscribe({
      next: (data) => { this.users = data || []; this.isLoading = false; },
      error: (err) => { this.errorMessage = getFriendlyError(err, 'load_users'); this.isLoading = false; }
    });
  }

  deleteUser(id: number): void {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    this.deletingId = id;
    this.apiService.deleteUser(id).subscribe({
      next: () => { this.users = this.users.filter(u => u.id !== id); this.deletingId = null; },
      error: (err) => { this.deletingId = null; alert(getFriendlyError(err, 'delete_user')); }
    });
  }

  roleClass(role: string): string {
    const map: Record<string, string> = {
      ADMIN: 'bg-red-500/10 text-red-900 border-red-500/20',
      RECRUITER: 'bg-green-500/10 text-green-900 border-green-500/20',
      JOB_SEEKER: 'bg-blue-500/10 text-blue-900 border-blue-500/20'
    };
    return map[role] || 'bg-gray-500/10 text-dark-900 border-dark-500/20';
  }
}
