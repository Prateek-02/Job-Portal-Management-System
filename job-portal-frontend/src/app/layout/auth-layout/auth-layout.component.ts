import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './auth-layout.component.html'
})
export class AuthLayoutComponent {
  getLayoutType(): string {
    return 'auth';
  }

  getContainerClass(): string {
    return 'auth-layout';
  }

  normalizeRedirect(path?: string): string {
    const value = (path || '').trim();
    return value ? value : '/login';
  }

  shouldUseCompactLayout(width: number): boolean {
    return width < 768;
  }

  getDefaultRedirect(): string {
    return '/login';
  }
}

