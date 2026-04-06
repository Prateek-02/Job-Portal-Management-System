import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
 import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../notifications/services/notification.service';
import { AdminReports, AdminUserResponse } from '../../../../models/api-response.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
   reports: AdminReports | null = null;
  isLoading = true;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

   ngOnInit(): void {
    this.apiService.getAdminReports().subscribe({
      next: (r) => { this.reports = r; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });

    this.checkNewUsers();
  }

  private checkNewUsers(): void {
    const admin = this.authService.getCurrentUser();
    if (!admin || !admin.id) return;

    this.apiService.getAdminUsers().subscribe({
      next: (users: AdminUserResponse[]) => {
        const seenKey = `jp_seen_users_${admin.id}`;
        const seenIds: number[] = JSON.parse(localStorage.getItem(seenKey) || '[]');
        
        let newCount = 0;
        users.forEach(user => {
          if (!seenIds.includes(user.id)) {
            // Only push notification if this is not the very first time we are loading users
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
