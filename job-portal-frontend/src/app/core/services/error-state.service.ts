import { Injectable } from '@angular/core';

export interface HttpErrorState {
  status: number;
  message: string;
  url: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ErrorStateService {
  private _error: HttpErrorState | null = null;

  set(error: HttpErrorState): void {
    this._error = error;
  }

  get(): HttpErrorState | null {
    return this._error;
  }

  clear(): void {
    this._error = null;
  }

  hasError(): boolean {
    return this._error !== null;
  }

  getStatusCode(defaultValue = 0): number {
    return this._error?.status ?? defaultValue;
  }

  getMessageOrFallback(fallback = 'Unknown error'): string {
    const message = this._error?.message?.trim();
    return message || fallback;
  }

  isServerError(): boolean {
    const status = this.getStatusCode();
    return status >= 500 && status <= 599;
  }

  toLogString(): string {
    const status = this.getStatusCode();
    const message = this.getMessageOrFallback();
    const url = this._error?.url || 'n/a';
    return `[${status}] ${message} @ ${url}`;
  }
}
