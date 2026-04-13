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

  constructor(private notificationService: NotificationService) { }
}
