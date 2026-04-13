import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecommendedJobsComponent } from './recommended-jobs.component';

describe('RecommendedJobsComponent', () => {
  let component: RecommendedJobsComponent;
  let fixture: ComponentFixture<RecommendedJobsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendedJobsComponent]
    })
    .overrideComponent(RecommendedJobsComponent, {
      set: { schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecommendedJobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });
});
