import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../features/notifications/services/notification.service';
import { NotificationPanelComponent } from '../../features/notifications/components/notification-panel/notification-panel.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NotificationPanelComponent, ThemeToggleComponent, SidebarComponent],
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent {
  isNotificationOpen = false;

  constructor(
    public authService: AuthService,
    public notificationService: NotificationService
  ) {}

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
