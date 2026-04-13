import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketPulseComponent } from './market-pulse.component';

describe('MarketPulseComponent', () => {
  let component: MarketPulseComponent;
  let fixture: ComponentFixture<MarketPulseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketPulseComponent]
    })
    .overrideComponent(MarketPulseComponent, {
      set: { schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketPulseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });
});
