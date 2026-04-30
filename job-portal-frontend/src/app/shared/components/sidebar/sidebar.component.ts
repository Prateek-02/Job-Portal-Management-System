import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  showLogoutModal = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  confirmLogout(): void {
    this.showLogoutModal = true;
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
  }

  executeLogout(): void {
    this.showLogoutModal = false;
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getAdminDashboardRoute(): string {
    return '/admin/dashboard';
  }

  getUsersRoute(): string {
    return '/admin/users';
  }

  getJobsRoute(): string {
    return '/admin/jobs';
  }

  getBrowseJobsRoute(): string {
    return '/jobs';
  }

  canShowAdminNav(): boolean {
    return this.authService.isAdmin();
  }

  getConsoleTitle(): string {
    return 'Admin Console';
  }

  getConsoleSubtitle(): string {
    return 'System Root';
  }
}
