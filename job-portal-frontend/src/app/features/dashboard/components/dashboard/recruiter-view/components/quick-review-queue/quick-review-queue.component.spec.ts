import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuickReviewQueueComponent } from './quick-review-queue.component';

describe('QuickReviewQueueComponent', () => {
  let component: QuickReviewQueueComponent;
  let fixture: ComponentFixture<QuickReviewQueueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickReviewQueueComponent]
    })
    .overrideComponent(QuickReviewQueueComponent, {
      set: { schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickReviewQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });
});
