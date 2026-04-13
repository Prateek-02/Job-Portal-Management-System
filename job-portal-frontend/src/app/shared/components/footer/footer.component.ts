import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  getFooterLabel(): string {
    return 'footer';
  }

  getCopyrightYear(date = new Date()): number {
    return date.getFullYear();
  }

  normalizeCompanyName(name?: string): string {
    const value = (name || '').trim();
    return value || 'Job Portal';
  }

  getFooterText(company?: string): string {
    return `${this.normalizeCompanyName(company)} - All rights reserved`;
  }

  shouldShowDivider(itemsCount: number): boolean {
    return itemsCount > 0;
  }
}
