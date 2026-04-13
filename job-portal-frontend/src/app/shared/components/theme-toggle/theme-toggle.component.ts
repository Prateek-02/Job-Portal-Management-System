import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.css']
})
export class ThemeToggleComponent {
  constructor(public themeService: ThemeService) {}

  isDarkMode(): boolean {
    return this.themeService.isDark();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getToggleTitle(): string {
    return this.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  }

  getIconName(): 'sun' | 'moon' {
    return this.isDarkMode() ? 'sun' : 'moon';
  }

  showSunIcon(): boolean {
    return this.isDarkMode();
  }

  showMoonIcon(): boolean {
    return !this.isDarkMode();
  }
}
