import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../notifications/services/notification.service';
import { AdminReports, AdminUserResponse } from '../../../../models/api-response.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  reports: AdminReports | null = null;
  isLoading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.apiService.getAdminReports().pipe(takeUntil(this.destroy$)).subscribe({
      next: (r) => { this.reports = r; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });

    this.checkNewUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkNewUsers(): void {
    const admin = this.authService.getCurrentUser();
    if (!admin || !admin.id) return;

    this.apiService.getAdminUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users: AdminUserResponse[]) => {
        const seenKey = `jp_seen_users_${admin.id}`;
        const seenIds: number[] = JSON.parse(localStorage.getItem(seenKey) || '[]');

        let newCount = 0;
        users.forEach(user => {
          if (!seenIds.includes(user.id)) {
            if (seenIds.length > 0) {
              this.notificationService.push(
                'USER_REGISTERED',
                'New User Registered',
                `${user.name} (${user.role}) has just joined the platform.`,
                '/admin/users'
              );
            }
            seenIds.push(user.id);
            newCount++;
          }
        });

        if (newCount > 0) {
          localStorage.setItem(seenKey, JSON.stringify(seenIds));
        }
      }
    });
  }
}
