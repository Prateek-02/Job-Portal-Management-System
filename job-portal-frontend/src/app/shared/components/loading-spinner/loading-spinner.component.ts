import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css']
})
export class LoadingSpinnerComponent {
  @Input() message?: string = 'Loading Celestial Data...';
  @Input() fullScreen: boolean = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get containerClasses(): string {
    return this.fullScreen 
      ? 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md'
      : 'flex flex-col items-center justify-center p-8';
  }

  get spinnerSizeClass(): string {
    switch (this.size) {
      case 'sm': return 'w-12 h-12';
      case 'lg': return 'w-32 h-32';
      default: return 'w-20 h-20';
    }
  }
}
