import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { NotificationType } from '../../models/notification.model';
import { vi } from 'vitest';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization and Core Flow', () => {
    // Normal working
    it('should initialize empty, allow pushing new notifications, and save per user', () => {
      // Simulate user login
      localStorage.setItem('current_user', JSON.stringify({ id: 101 }));
      service = TestBed.inject(NotificationService); // Initializes and reads straight from storage

      expect(service.all.length).toBe(0);

      service.push('JOB_POSTED', 'Test Title', 'Test Message');

      expect(service.all.length).toBe(1);
      expect(service.unreadCount).toBe(1);
      expect(service.all[0].title).toBe('Test Title');
      expect(service.all[0].read).toBe(false);

      // Should save to local storage with specific user ID key
      const stored = JSON.parse(localStorage.getItem('jp_notifications_101')!);
      expect(stored.length).toBe(1);
    });

    // Normal working - Mark as read
    it('should mark notifications as read successfully', () => {
      service = TestBed.inject(NotificationService);
      service.setUserId(1); // Set active user
      service.push('JOB_APPLIED', 'T', 'M');

      const id = service.all[0].id;
      service.markRead(id);

      expect(service.all[0].read).toBe(true);
      expect(service.unreadCount).toBe(0);

      // markAllRead works
      service.push('APPLICATION_STATUS', 'T2', 'M2');
      service.push('USER_REGISTERED', 'T3', 'M3');
      expect(service.unreadCount).toBe(2);

      service.markAllRead();
      expect(service.unreadCount).toBe(0);
    });

    it('should support clearAll and idempotent setUserId branch', () => {
      service = TestBed.inject(NotificationService);
      service.setUserId(7);
      service.push('JOB_POSTED', 'A', 'B');
      expect(service.all.length).toBe(1);

      // Same user id should short-circuit without reloading storage.
      service.setUserId(7);
      expect(service.all.length).toBe(1);

      service.clearAll();
      expect(service.all).toEqual([]);
      expect(service.unreadCount).toBe(0);
    });

    it('should not mark anything when markRead id does not match', () => {
      service = TestBed.inject(NotificationService);
      service.setUserId(1);
      service.push('JOB_POSTED', 'Title', 'Message');
      const originalId = service.all[0].id;

      service.markRead('non-matching-id');
      expect(service.all[0].id).toBe(originalId);
      expect(service.all[0].read).toBe(false);
    });
  });

  describe('Boundaries', () => {
    // Boundary value
    it('should restrict storage to a maximum of 50 recent notifications array bounds', () => {
      service = TestBed.inject(NotificationService);
      service.setUserId(1);

      // Push 55 notifications
      for (let i = 0; i < 55; i++) {
        service.push('JOB_POSTED', `Title ${i}`, 'Msg');
      }

      expect(service.all.length).toBe(50);

      // The newest one (Title 54) should be at index 0 (LIFO array behavior checked in source)
      expect(service.all[0].title).toBe('Title 54');
      // The oldest retained should be Title 5 (54 down to 5)
      expect(service.all[49].title).toBe('Title 5');
    });
  });

  describe('Exception Handling', () => {
    // Exception handling
    it('should gracefully handle localStorage quota exceeded exceptions during save without crashing', () => {
      service = TestBed.inject(NotificationService);
      service.setUserId(2);

      vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded'); });

      // Should not throw despite localStorage failing
      expect(() => {
        service.push('JOB_POSTED', 'No Crash', 'Please');
      }).not.toThrow();

      // Data remains in memory
      expect(service.all.length).toBe(1);

      vi.restoreAllMocks();
    });

    // Exception handling
    it('should handle corrupted JSON upon load without throwing', () => {
      // Create corrupt JSON in storage BEFORE injecting service
      localStorage.setItem('current_user', JSON.stringify({ id: 999 }));
      localStorage.setItem('jp_notifications_999', '}{bad json...');

      // Injection triggers init() -> load()
      expect(() => {
        service = TestBed.inject(NotificationService);
      }).not.toThrow();

      // Should return empty array gracefully
      expect(service.all).toEqual([]);
    });

    it('should gracefully ignore corrupted current_user json during init', () => {
      localStorage.setItem('current_user', '{bad-json}');
      expect(() => {
        service = TestBed.inject(NotificationService);
      }).not.toThrow();
      expect(service.all).toEqual([]);
    });

    it('should keep in-memory updates when no user id is set', () => {
      service = TestBed.inject(NotificationService);
      service.setUserId(null);
      service.push('JOB_POSTED', 'No User', 'Memory only');

      expect(service.all.length).toBe(1);
      expect(localStorage.getItem('jp_notifications')).toBeNull();
    });

    it('should initialize gracefully when current user has no id', () => {
      localStorage.setItem('current_user', JSON.stringify({ name: 'NoId' }));
      service = TestBed.inject(NotificationService);
      expect(service.all).toEqual([]);
    });
  });
});
