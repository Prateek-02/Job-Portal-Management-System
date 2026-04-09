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
}
