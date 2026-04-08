import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../../../../core/services/api.service';

@Component({
  selector: 'app-market-pulse',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './market-pulse.component.html'
})
export class MarketPulseComponent implements OnInit {
  marketStats: any = null;
  salaryTrendPoints = '';
  marketDemandPoints = '';
  topSkills: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getMarketPulseStats().subscribe(stats => {
      if (stats) {
        this.marketStats = stats;
        this.topSkills = stats.topSkills || [];
        this.salaryTrendPoints = this.mapTrendToPoints(stats.salaryTrend);
        this.marketDemandPoints = this.mapTrendToPoints(stats.demandTrend);
      }
    });
  }

  private mapTrendToPoints(data: number[], width = 100, height = 40): string {
    if (!data || data.length === 0) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    return data.map((val, i) => {
      const x = (i * width) / (data.length - 1);
      const y = height - ((val - min) * height) / range;
      const clampedY = Math.max(5, Math.min(height - 5, y));
      return `${Math.round(x)},${Math.round(clampedY)}`;
    }).join(' ');
  }

  formatSalary(amount: number): string {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}
