import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { AdminUserResponse } from '../../../../models/api-response.model';
import { getFriendlyError } from '../../../../core/utils/error-handler.util';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, DatePipe, PaginationComponent],
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: AdminUserResponse[] = [];
  isLoading = true;
  deletingId: number | null = null;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  // Pagination
  currentPage = 0;
  pageSize = 10;

  get totalPages(): number {
    return Math.ceil(this.users.length / this.pageSize);
  }

  get pagedUsers(): AdminUserResponse[] {
    const start = this.currentPage * this.pageSize;
    return this.users.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.apiService.getAdminUsers().pipe(takeUntil(this.destroy$)).subscribe({
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
