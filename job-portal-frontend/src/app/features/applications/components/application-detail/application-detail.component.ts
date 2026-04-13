import { Component } from '@angular/core';

@Component({
  selector: 'app-application-detail',
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.css']
})
export class ApplicationDetailComponent {
  getViewMode(): string {
    return 'detail';
  }

  getHeaderLabel(): string {
    return 'Application Detail';
  }

  normalizeStatus(status?: string): string {
    const value = (status || '').trim().toUpperCase();
    return value || 'UNKNOWN';
  }

  isTerminalStatus(status?: string): boolean {
    const value = this.normalizeStatus(status);
    return value === 'REJECTED' || value === 'ACCEPTED';
  }

  getStatusClass(status?: string): string {
    return this.isTerminalStatus(status) ? 'final' : 'active';
  }
}
