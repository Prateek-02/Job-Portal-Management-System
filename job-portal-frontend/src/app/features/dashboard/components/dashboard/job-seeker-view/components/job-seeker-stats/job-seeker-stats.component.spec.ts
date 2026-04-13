import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobSeekerStatsComponent } from './job-seeker-stats.component';

describe('JobSeekerStatsComponent', () => {
  let component: JobSeekerStatsComponent;
  let fixture: ComponentFixture<JobSeekerStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobSeekerStatsComponent]
    })
    .overrideComponent(JobSeekerStatsComponent, {
      set: { schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JobSeekerStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });
});
