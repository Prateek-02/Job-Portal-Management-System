import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorStateService, HttpErrorState } from '../../../../core/services/error-state.service';

interface ErrorConfig {
  code: string;
  title: string;
  subtitle: string;
  description: string;
  icon: 'lock' | 'search' | 'server' | 'network' | 'generic';
  color: string;
  actions: { label: string; route: string; primary: boolean }[];
}

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-page.component.html'
})
export class ErrorPageComponent implements OnInit {
  errorState: HttpErrorState | null = null;
  config!: ErrorConfig;

  private readonly configs: Record<string, ErrorConfig> = {
    '403': {
      code: '403',
      title: 'Access Denied',
      subtitle: 'You don\'t have permission to access this resource.',
      description: 'Your account role does not grant access to this area. If you believe this is an error, please contact an administrator.',
      icon: 'lock',
      color: 'energy-violet',
      actions: [
        { label: 'Go to Dashboard', route: '/dashboard', primary: true },
        { label: 'Go Home', route: '/', primary: false }
      ]
    },
    '404': {
      code: '404',
      title: 'Resource Not Found',
      subtitle: 'The requested data or page no longer exists.',
      description: 'The resource you were looking for may have been removed, had its name changed, or is temporarily unavailable.',
      icon: 'search',
      color: 'energy-violet',
      actions: [
        { label: 'Browse Jobs', route: '/jobs', primary: true },
        { label: 'Go Home', route: '/', primary: false }
      ]
    },
    '500': {
      code: '500',
      title: 'Server Error',
      subtitle: 'Something went wrong on our end.',
      description: 'Our servers encountered an unexpected condition. The engineering team has been notified. Please try again in a moment.',
      icon: 'server',
      color: 'energy-coral',
      actions: [
        { label: 'Try Again', route: '', primary: true },
        { label: 'Go Home', route: '/', primary: false }
      ]
    },
    'network': {
      code: '0',
      title: 'No Connection',
      subtitle: 'Unable to reach the server.',
      description: 'Please check your internet connection and try again. If the problem persists, the server may be temporarily down.',
      icon: 'network',
      color: 'amber',
      actions: [
        { label: 'Retry', route: '', primary: true },
        { label: 'Go Home', route: '/', primary: false }
      ]
    },
    'generic': {
      code: 'ERR',
      title: 'Something Went Wrong',
      subtitle: 'An unexpected error has occurred.',
      description: 'We\'re sorry for the inconvenience. Please try refreshing the page or navigating back to a known-good location.',
      icon: 'generic',
      color: 'energy-violet',
      actions: [
        { label: 'Go to Dashboard', route: '/dashboard', primary: true },
        { label: 'Go Home', route: '/', primary: false }
      ]
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private errorStateService: ErrorStateService
  ) {}

  ngOnInit(): void {
    // Grab the error context set by the interceptor
    this.errorState = this.errorStateService.get();
    this.errorStateService.clear(); // Consume it immediately

    // Pick config based on the route segment (:code param)
    const code = this.route.snapshot.paramMap.get('code') ?? 'generic';
    this.config = this.configs[code] ?? this.configs['generic'];
  }

  handleAction(route: string): void {
    if (!route) {
      window.location.reload();
    } else {
      this.router.navigateByUrl(route);
    }
  }

  get formattedTimestamp(): string {
    if (!this.errorState?.timestamp) return '';
    return new Date(this.errorState.timestamp).toLocaleTimeString();
  }
}
