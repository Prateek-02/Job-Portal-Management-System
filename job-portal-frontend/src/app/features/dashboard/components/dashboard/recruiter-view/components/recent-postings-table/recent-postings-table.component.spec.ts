import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecentPostingsTableComponent } from './recent-postings-table.component';

describe('RecentPostingsTableComponent', () => {
  let component: RecentPostingsTableComponent;
  let fixture: ComponentFixture<RecentPostingsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentPostingsTableComponent]
    })
    .overrideComponent(RecentPostingsTableComponent, {
      set: { schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecentPostingsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });
});
