import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  @Input() user: any;
  @Input() isJobSeeker = false;
  @Input() isRecruiter = false;

  getInitial(): string {
    return this.user?.name?.charAt(0)?.toUpperCase() || 'U';
  }

  getDisplayName(): string {
    return this.user?.name || 'User Profile';
  }

  getRoleLabel(): string {
    if (this.isJobSeeker) return 'Job Seeker';
    if (this.isRecruiter) return 'Recruiter';
    return 'System Admin';
  }
}
