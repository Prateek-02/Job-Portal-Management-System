import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  getPageTitle(): string {
    return 'Admin Dashboard';
  }

  getSectionCount(): number {
    return 3;
  }

  normalizeSectionName(value?: string): string {
    const text = (value || '').trim();
    return text ? text.toLowerCase() : 'overview';
  }

  isKnownSection(value?: string): boolean {
    return ['overview', 'users', 'jobs'].includes(this.normalizeSectionName(value));
  }

  getDefaultSection(): string {
    return 'overview';
  }
}
