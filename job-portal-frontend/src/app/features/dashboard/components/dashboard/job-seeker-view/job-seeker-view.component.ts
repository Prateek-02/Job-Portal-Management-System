import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobSeekerStatsComponent } from './components/job-seeker-stats/job-seeker-stats.component';
import { RecommendedJobsComponent } from './components/recommended-jobs/recommended-jobs.component';
import { RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { MarketPulseComponent } from './components/market-pulse/market-pulse.component';

@Component({
  selector: 'app-job-seeker-view',
  standalone: true,
  imports: [
    CommonModule, 
    JobSeekerStatsComponent,
    RecommendedJobsComponent,
    RecentActivityComponent,
    MarketPulseComponent
  ],
  templateUrl: './job-seeker-view.component.html'
})
export class JobSeekerViewComponent {
  @Input() user: any;
}
