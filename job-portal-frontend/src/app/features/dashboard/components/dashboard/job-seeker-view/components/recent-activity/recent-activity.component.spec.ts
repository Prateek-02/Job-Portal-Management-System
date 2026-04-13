import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecentActivityComponent } from './recent-activity.component';

describe('RecentActivityComponent', () => {
  let component: RecentActivityComponent;
  let fixture: ComponentFixture<RecentActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentActivityComponent]
    })
    .overrideComponent(RecentActivityComponent, {
      set: { schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecentActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });
});
