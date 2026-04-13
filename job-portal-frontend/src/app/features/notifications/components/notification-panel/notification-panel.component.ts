import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { AppNotification } from '../../../../models/notification.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.css']
})
export class NotificationPanelComponent implements OnDestroy {
  notifications: AppNotification[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    public notificationService: NotificationService,
    private router: Router
  ) {
    this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(n => {
      this.notifications = n.slice(0, 5);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  markRead(id: string): void {
    this.notificationService.markRead(id);
  }

  markAllRead(): void {
    this.notificationService.markAllRead();
  }

  viewAll(): void {
    this.router.navigate(['/notifications']);
  }

  handleNotificationClick(n: AppNotification): void {
    this.markRead(n.id);
    if (n.link) {
      this.router.navigateByUrl(n.link);
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'APPLICATION_STATUS': return 'status';
      case 'JOB_APPLIED': return 'applied';
      case 'JOB_POSTED': return 'posted';
      default: return 'default';
    }
  }

  timeAgo(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
}
