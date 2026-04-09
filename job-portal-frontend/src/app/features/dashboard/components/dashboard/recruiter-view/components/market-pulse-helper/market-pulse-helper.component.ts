import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../../../../core/services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-market-pulse-helper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './market-pulse-helper.component.html'
})
export class MarketPulseHelperComponent implements OnInit, OnDestroy {
  stats: any = null;

  private destroy$ = new Subject<void>();

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getMarketPulseStats().pipe(takeUntil(this.destroy$)).subscribe(stats => {
      this.stats = stats;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
