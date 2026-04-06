import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../features/notifications/services/notification.service';
import { NotificationPanelComponent } from '../../features/notifications/components/notification-panel/notification-panel.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NotificationPanelComponent],
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent {
  isNotificationOpen = false;

  constructor(
    public authService: AuthService,
    public notificationService: NotificationService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  toggleNotifications(event?: Event): void {
    if (event) event.stopPropagation();
    this.isNotificationOpen = !this.isNotificationOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isClickInsideNotification = target.closest('.notification-container');
    if (!isClickInsideNotification) {
      this.isNotificationOpen = false;
    }
  }
}
