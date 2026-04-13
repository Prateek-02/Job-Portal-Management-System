import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecentCandidatesTableComponent } from './recent-candidates-table.component';

describe('RecentCandidatesTableComponent', () => {
  let component: RecentCandidatesTableComponent;
  let fixture: ComponentFixture<RecentCandidatesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentCandidatesTableComponent]
    })
    .overrideComponent(RecentCandidatesTableComponent, {
      set: { schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecentCandidatesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });
});
