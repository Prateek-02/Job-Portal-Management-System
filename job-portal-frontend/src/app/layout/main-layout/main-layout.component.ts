import { Component, OnInit, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../features/notifications/services/notification.service';
import { NotificationPanelComponent } from '../../features/notifications/components/notification-panel/notification-panel.component';


@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, NotificationPanelComponent],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent implements OnInit {
  currentUser: any = null;
  isMenuOpen = false;
  isDropdownOpen = false;
  isNotificationOpen = false;

  constructor(
    public authService: AuthService, 
    public notificationService: NotificationService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: any) => {
      this.currentUser = user;
      this.updateSphereColor();
    });
  }

  private updateSphereColor(): void {
    let color = 'var(--color-energy-indigo)';
    if (this.authService.isJobSeeker()) {
      color = 'var(--color-energy-violet)';
    } else if (this.authService.isRecruiter()) {
      color = 'var(--color-energy-emerald)';
    }
    document.documentElement.style.setProperty('--energy-sphere-color', color);
  }

  getLogoLink(): string {
    if (this.authService.isAdmin()) return '/admin/dashboard';
    if (this.authService.isRecruiter() || this.authService.isJobSeeker()) return '/dashboard';
    return '/';
  }

  logout(): void {
    this.authService.logout();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) this.isNotificationOpen = false;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  toggleNotifications(event?: Event): void {
    if (event) event.stopPropagation();
    this.isNotificationOpen = !this.isNotificationOpen;
    if (this.isNotificationOpen) this.isDropdownOpen = false;
  }

  showNotifications(): void {
    this.isNotificationOpen = true;
    this.isDropdownOpen = false;
  }

  hideNotifications(): void {
    this.isNotificationOpen = false;
  }

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // Select the notification bell and profile button
    const isClickInsideNotificationBell = target.closest('.notification-container');
    const isClickInsideProfileBtn = target.closest('.profile-container');
    
    // Only close if the click was not on the buttons themselves
    if (!isClickInsideNotificationBell && !isClickInsideProfileBtn) {
      this.isNotificationOpen = false;
      this.isDropdownOpen = false;
    }
  }
}
