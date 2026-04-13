import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecentActivityComponent } from './recent-activity.component';
import { NotificationService } from '../../../../../../../core/services/notification.service';

describe('RecentActivityComponent', () => {
  let component: RecentActivityComponent;
  let fixture: ComponentFixture<RecentActivityComponent>;
  let notificationServiceMock: any;

  beforeEach(async () => {
    notificationServiceMock = { all: [] };
    await TestBed.configureTestingModule({
      imports: [RecentActivityComponent],
      providers: [{ provide: NotificationService, useValue: notificationServiceMock }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecentActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });

  it('should return only top 4 recent activities', () => {
    notificationServiceMock.all = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
    expect(component.recentActivity.map((x: any) => x.id)).toEqual([1, 2, 3, 4]);
  });

  it('should return empty list when no activity exists', () => {
    notificationServiceMock.all = [];
    expect(component.recentActivity).toEqual([]);
  });

  it('should support direct class instantiation', () => {
    const direct = new RecentActivityComponent(notificationServiceMock);
    expect(direct).toBeTruthy();
  });

  it('should compute visibility helpers correctly', () => {
    notificationServiceMock.all = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    expect(component.hasRecentActivity()).toBe(true);
    expect(component.visibleActivity(2).length).toBe(2);
    expect(component.trackByActivityId(0, { id: 'x' })).toBe('x');
    expect(component.trackByActivityId(2, null)).toBe(2);
  });
});
