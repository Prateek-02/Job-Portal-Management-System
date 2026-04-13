import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationPanelComponent } from './notification-panel.component';
import { NotificationService } from '../../../../core/services/notification.service';

describe('NotificationPanelComponent', () => {
  let component: NotificationPanelComponent;
  let fixture: ComponentFixture<NotificationPanelComponent>;
  let notifications$: BehaviorSubject<any[]>;
  let notificationServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    notifications$ = new BehaviorSubject<any[]>([]);
    notificationServiceMock = {
      notifications$,
      markRead: vi.fn(),
      markAllRead: vi.fn()
    };
    routerMock = {
      navigate: vi.fn(),
      navigateByUrl: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [NotificationPanelComponent],
      providers: [
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and limit visible notifications to 5', () => {
    const items = Array.from({ length: 8 }).map((_, i) => ({
      id: `id-${i}`,
      type: 'JOB_POSTED',
      title: `T${i}`,
      message: 'M',
      timestamp: new Date().toISOString(),
      read: false
    }));
    notifications$.next(items);
    expect(component.notifications.length).toBe(5);
    expect(component.notifications[0].id).toBe('id-0');
  });

  it('should mark individual and all notifications as read', () => {
    component.markRead('abc');
    component.markAllRead();
    expect(notificationServiceMock.markRead).toHaveBeenCalledWith('abc');
    expect(notificationServiceMock.markAllRead).toHaveBeenCalled();
  });

  it('should route correctly for viewAll and linked notification click', () => {
    component.viewAll();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/notifications']);

    component.handleNotificationClick({ id: '1', link: '/jobs/1' } as any);
    expect(notificationServiceMock.markRead).toHaveBeenCalledWith('1');
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/jobs/1');
  });

  it('should not navigate by url when notification has no link', () => {
    component.handleNotificationClick({ id: '2' } as any);
    expect(notificationServiceMock.markRead).toHaveBeenCalledWith('2');
    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should return icon keys and human-readable time labels', () => {
    expect(component.getIcon('APPLICATION_STATUS')).toBe('status');
    expect(component.getIcon('JOB_APPLIED')).toBe('applied');
    expect(component.getIcon('JOB_POSTED')).toBe('posted');
    expect(component.getIcon('OTHER')).toBe('default');

    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    expect(component.timeAgo(new Date(now - 10_000).toISOString())).toBe('Just now');
    expect(component.timeAgo(new Date(now - 5 * 60_000).toISOString())).toBe('5m ago');
    expect(component.timeAgo(new Date(now - 3 * 60 * 60_000).toISOString())).toBe('3h ago');
    expect(component.timeAgo(new Date(now - 2 * 24 * 60 * 60_000).toISOString())).toBe('2d ago');
    vi.restoreAllMocks();
  });

  it('should cleanup subscription subject on destroy', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');
    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
