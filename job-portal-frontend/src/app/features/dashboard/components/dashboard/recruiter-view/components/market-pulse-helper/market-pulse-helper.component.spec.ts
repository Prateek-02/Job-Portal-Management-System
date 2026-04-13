import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketPulseHelperComponent } from './market-pulse-helper.component';
import { ApiService } from '../../../../../../../core/services/api.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('MarketPulseHelperComponent', () => {
  let component: MarketPulseHelperComponent;
  let fixture: ComponentFixture<MarketPulseHelperComponent>;
  let apiServiceMock: any;

  beforeEach(async () => {
    apiServiceMock = {
      getMarketPulseStats: vi.fn().mockReturnValue(of({ jobsCount: 12 }))
    };

    await TestBed.configureTestingModule({
      imports: [MarketPulseHelperComponent],
      providers: [{ provide: ApiService, useValue: apiServiceMock }]
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

  it('should load market pulse stats on init', () => {
    expect(apiServiceMock.getMarketPulseStats).toHaveBeenCalled();
    expect(component.stats).toEqual({ jobsCount: 12 });
  });

  it('should complete destroy subject on ngOnDestroy', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');
    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(completeSpy).toHaveBeenCalledTimes(1);
  });

  it('should support direct class instantiation', () => {
    const direct = new MarketPulseHelperComponent(apiServiceMock);
    expect(direct).toBeTruthy();
  });

  it('should compute demand label and top skills summary', () => {
    component.stats = { marketDemandStatus: 'High', topSkills: [{ name: 'Angular' }, { name: 'Java' }] };
    expect(component.getDemandLabel()).toBe('Peaking Currently');
    expect(component.getTopSkillsSummary()).toBe('Angular and Java');
    component.stats = { marketDemandStatus: 'Low', topSkills: [] };
    expect(component.getDemandLabel()).toBe('Growing Daily');
    expect(component.getTopSkillsSummary()).toBe('relevant technologies');
  });
});
