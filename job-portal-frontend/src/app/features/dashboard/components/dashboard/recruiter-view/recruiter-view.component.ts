import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RecruiterStatsComponent } from './components/recruiter-stats/recruiter-stats.component';
import { QuickReviewQueueComponent } from './components/quick-review-queue/quick-review-queue.component';
import { MarketPulseHelperComponent } from './components/market-pulse-helper/market-pulse-helper.component';
import { RecentPostingsTableComponent } from './components/recent-postings-table/recent-postings-table.component';
import { RecentCandidatesTableComponent } from './components/recent-candidates-table/recent-candidates-table.component';

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
export class RecruiterViewComponent {}
