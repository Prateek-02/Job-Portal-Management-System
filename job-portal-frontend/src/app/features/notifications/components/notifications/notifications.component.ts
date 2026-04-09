import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { AppNotification } from '../../../../models/notification.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: AppNotification[] = [];
  currentFilter: 'all' | 'read' | 'unread' = 'all';

  private destroy$ = new Subject<void>();

  constructor(
    public notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(n => {
      this.notifications = n;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredNotifications(): AppNotification[] {
    if (this.currentFilter === 'read') return this.notifications.filter(n => n.read);
    if (this.currentFilter === 'unread') return this.notifications.filter(n => !n.read);
    return this.notifications;
  }

  setFilter(filter: 'all' | 'read' | 'unread'): void {
    this.currentFilter = filter;
    this.cdr.detectChanges();
  }

  handleClick(n: AppNotification): void {
    this.notificationService.markRead(n.id);
    if (n.link) {
      this.router.navigateByUrl(n.link);
    }
  }

  markAllRead(): void {
    this.notificationService.markAllRead();
  }

  clearAll(): void {
    this.notificationService.clearAll();
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
