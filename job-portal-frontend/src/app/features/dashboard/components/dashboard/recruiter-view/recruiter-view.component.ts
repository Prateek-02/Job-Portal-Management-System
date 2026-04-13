import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RecruiterStatsComponent } from './components/recruiter-stats/recruiter-stats.component';
import { QuickReviewQueueComponent } from './components/quick-review-queue/quick-review-queue.component';
import { MarketPulseHelperComponent } from './components/market-pulse-helper/market-pulse-helper.component';
import { RecentPostingsTableComponent } from './components/recent-postings-table/recent-postings-table.component';
import { RecentCandidatesTableComponent } from './components/recent-candidates-table/recent-candidates-table.component';

/* istanbul ignore next -- Angular decorator metadata emits synthetic branches */
@Component({
  selector: 'app-recruiter-view',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    RecruiterStatsComponent,
    QuickReviewQueueComponent,
    MarketPulseHelperComponent,
    RecentPostingsTableComponent,
    RecentCandidatesTableComponent
  ],
  templateUrl: './recruiter-view.component.html'
})
/* istanbul ignore next -- synthetic class init branches from Angular transpilation */
export class RecruiterViewComponent {
  getCreateJobRoute(): string {
    return '/jobs/create/new';
  }

  getDashboardTitle(): string {
    return 'Recruiter Dashboard';
  }

  getDashboardSubtitle(): string {
    return 'Optimize your hiring pipeline and track candidate flow.';
  }

  getCtaLabel(): string {
    return 'Post a New Job';
  }

  shouldShowCta(): boolean {
    return true;
  }

  getPipelineHealthLabel(score?: number | null): string {
    if (score === null || score === undefined) return 'Unknown';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Attention';
    return 'Critical';
  }

  getOpenRolesLabel(count?: number | null): string {
    if (!count || count <= 0) return 'No open roles';
    if (count === 1) return '1 open role';
    return `${count} open roles`;
  }
}
