import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppNotification, NotificationType } from '../../../models/notification.model';

const STORAGE_KEY = 'jp_notifications';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<AppNotification[]>(this.load());
  public notifications$ = this.notificationsSubject.asObservable();

  get unreadCount(): number {
    return this.notificationsSubject.value.filter(n => !n.read).length;
  }

  get all(): AppNotification[] {
    return this.notificationsSubject.value;
  }

  /** Add a new in-app notification */
  push(type: NotificationType, title: string, message: string, link?: string): void {
    const notification: AppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      link
    };
    const updated = [notification, ...this.notificationsSubject.value].slice(0, 50);
    this.save(updated);
  }

  markRead(id: string): void {
    const updated = this.notificationsSubject.value.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this.save(updated);
  }

  markAllRead(): void {
    const updated = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.save(updated);
  }

  clearAll(): void {
    this.save([]);
  }

  private save(notifications: AppNotification[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {}
    this.notificationsSubject.next(notifications);
  }

  private load(): AppNotification[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
