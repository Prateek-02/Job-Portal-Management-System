import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketPulseComponent } from './market-pulse.component';
import { of } from 'rxjs';
import { ApiService } from '../../../../../../../core/services/api.service';

describe('MarketPulseComponent', () => {
  let component: MarketPulseComponent;
  let fixture: ComponentFixture<MarketPulseComponent>;
  let apiServiceMock: any;

  beforeEach(async () => {
    apiServiceMock = { getMarketPulseStats: vi.fn().mockReturnValue(of(null)) };

    await TestBed.configureTestingModule({
      imports: [MarketPulseComponent],
      providers: [{ provide: ApiService, useValue: apiServiceMock }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketPulseComponent);
    component = fixture.componentInstance;
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });

  it('should hydrate market stats and trend points from API', () => {
    apiServiceMock.getMarketPulseStats.mockReturnValue(of({
      topSkills: [{ name: 'Angular' }],
      salaryTrend: [2, 4, 6, 8],
      demandTrend: [1, 3, 2, 4]
    }));
    component.ngOnInit();

    expect(component.marketStats).toBeTruthy();
    expect(component.topSkills.length).toBe(1);
    expect(component.salaryTrendPoints).toContain(',');
    expect(component.marketDemandPoints).toContain(',');
  });

  it('should keep defaults when API returns null stats', () => {
    apiServiceMock.getMarketPulseStats.mockReturnValue(of(null));
    component.ngOnInit();
    expect(component.marketStats).toBeNull();
    expect(component.salaryTrendPoints).toBe('');
    expect(component.marketDemandPoints).toBe('');
  });

  it('should cover mapTrendToPoints edge branches', () => {
    expect((component as any).mapTrendToPoints([])).toBe('');
    const flat = (component as any).mapTrendToPoints([5, 5, 5], 100, 40);
    expect(flat).toContain('0,35');
    expect(flat).toContain('50,35');
    expect(flat).toContain('100,35');
  });

  it('should format salaries in both branches', () => {
    expect(component.formatSalary(100000)).toBe('₹1.0L');
    expect(component.formatSalary(50000)).toBe('₹50,000');
  });

  it('should cleanup on destroy', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');
    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
