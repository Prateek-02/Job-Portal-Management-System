import { Component } from '@angular/core';

@Component({
  selector: 'app-job-filter',
  templateUrl: './job-filter.component.html',
  styleUrls: ['./job-filter.component.css']
})
export class JobFilterComponent {
  getFilterMode(): string {
    return 'basic';
  }

  getDefaultSort(): string {
    return 'latest';
  }

  normalizeKeyword(value?: string): string {
    return (value || '').trim().toLowerCase();
  }

  hasKeyword(value?: string): boolean {
    return this.normalizeKeyword(value).length > 0;
  }

  getKeywordSummary(value?: string): string {
    return this.hasKeyword(value) ? this.normalizeKeyword(value) : 'all jobs';
  }
}
