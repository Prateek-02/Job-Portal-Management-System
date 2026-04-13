import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationService } from '../../../../../../../core/services/notification.service';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './recent-activity.component.html'
})
export class RecentActivityComponent {
  get recentActivity() {
    return this.notificationService.all.slice(0, 4);
  }

  hasRecentActivity(): boolean {
    return this.recentActivity.length > 0;
  }

  visibleActivity(limit = 3) {
    return this.recentActivity.slice(0, limit);
  }

  trackByActivityId(_: number, entry: any): string | number {
    return entry?.id ?? _;
  }

  constructor(private notificationService: NotificationService) { }
}
