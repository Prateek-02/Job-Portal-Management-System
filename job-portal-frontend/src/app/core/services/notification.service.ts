import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppNotification, NotificationType } from '../../models/notification.model';

const BASE_STORAGE_KEY = 'jp_notifications';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private currentUserId: number | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    // We try to get user from localStorage directly to initialize early
    try {
      const userStr = localStorage.getItem('current_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          this.setUserId(user.id);
        }
      }
    } catch { }
  }

  public setUserId(userId: number | null): void {
    if (this.currentUserId === userId) return;
    this.currentUserId = userId;
    this.notificationsSubject.next(this.load());
  }

  private get storageKey(): string {
    return this.currentUserId ? `${BASE_STORAGE_KEY}_${this.currentUserId}` : BASE_STORAGE_KEY;
  }

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
      if (this.currentUserId) {
        localStorage.setItem(this.storageKey, JSON.stringify(notifications));
      }
    } catch { }
    this.notificationsSubject.next(notifications);
  }

  private load(): AppNotification[] {
    try {
      if (!this.currentUserId) return [];
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
