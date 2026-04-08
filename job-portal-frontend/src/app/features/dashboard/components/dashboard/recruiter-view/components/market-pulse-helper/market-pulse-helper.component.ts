import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../../../../core/services/api.service';

@Component({
  selector: 'app-market-pulse-helper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './market-pulse-helper.component.html'
})
export class MarketPulseHelperComponent implements OnInit {
  stats: any = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getMarketPulseStats().subscribe(stats => {
      this.stats = stats;
    });
  }
}
