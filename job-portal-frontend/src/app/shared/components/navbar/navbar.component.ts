import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CacheService } from '../../../core/services/cache.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { NotificationPanelComponent } from '../../../features/notifications/components/notification-panel/notification-panel.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeToggleComponent, NotificationPanelComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  currentUser: any = null;
  isMenuOpen = false;
  isDropdownOpen = false;
  isNotificationOpen = false;

  constructor(
    public authService: AuthService,
    public notificationService: NotificationService,
    private router: Router,
    private cacheService: CacheService
  ) { }

  refreshData(): void {
    this.cacheService.clearAll();
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: any) => {
      this.currentUser = user;
    });
  }

  getLogoLink(): string {
    if (this.authService.isAdmin()) return '/admin/dashboard';
    if (this.authService.isRecruiter() || this.authService.isJobSeeker()) return '/dashboard';
    return '/';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isClickInsideNotificationBell = target.closest('.notification-container');
    const isClickInsideProfileBtn = target.closest('.profile-container');

    if (!isClickInsideNotificationBell && !isClickInsideProfileBtn) {
      this.isNotificationOpen = false;
      this.isDropdownOpen = false;
    }
  }
}
