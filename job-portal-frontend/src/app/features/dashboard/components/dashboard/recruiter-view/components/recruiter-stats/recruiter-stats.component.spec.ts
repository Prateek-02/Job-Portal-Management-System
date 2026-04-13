import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecruiterStatsComponent } from './recruiter-stats.component';

describe('RecruiterStatsComponent', () => {
  let component: RecruiterStatsComponent;
  let fixture: ComponentFixture<RecruiterStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecruiterStatsComponent]
    })
    .overrideComponent(RecruiterStatsComponent, {
      set: { schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecruiterStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });
});
