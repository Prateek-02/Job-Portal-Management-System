import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketPulseHelperComponent } from './market-pulse-helper.component';

describe('MarketPulseHelperComponent', () => {
  let component: MarketPulseHelperComponent;
  let fixture: ComponentFixture<MarketPulseHelperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketPulseHelperComponent]
    })
    .overrideComponent(MarketPulseHelperComponent, {
      set: { schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketPulseHelperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });
});
