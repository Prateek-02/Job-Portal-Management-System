import { Component } from '@angular/core';

@Component({
  selector: 'app-application-list',
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.css']
})
export class ApplicationListComponent {
  getViewMode(): string {
    return 'list';
  }

  getEmptyStateLabel(): string {
    return 'No applications found';
  }

  normalizeQuery(query?: string): string {
    return (query || '').trim().toLowerCase();
  }

  shouldShowEmptyState(count: number): boolean {
    return count <= 0;
  }

  canApplyFilter(query?: string): boolean {
    return this.normalizeQuery(query).length > 0;
  }
}
