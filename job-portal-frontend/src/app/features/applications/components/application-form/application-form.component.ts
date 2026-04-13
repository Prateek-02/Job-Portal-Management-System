import { Component } from '@angular/core';

@Component({
  selector: 'app-application-form',
  templateUrl: './application-form.component.html',
  styleUrls: ['./application-form.component.css']
})
export class ApplicationFormComponent {
  getViewMode(): string {
    return 'form';
  }

  getFormTitle(): string {
    return 'Application Form';
  }

  sanitizeInput(value?: string): string {
    return (value || '').trim();
  }

  hasMinimumLength(value: string, min = 3): boolean {
    return this.sanitizeInput(value).length >= min;
  }

  getValidationState(value: string): 'valid' | 'invalid' {
    return this.hasMinimumLength(value) ? 'valid' : 'invalid';
  }
}
