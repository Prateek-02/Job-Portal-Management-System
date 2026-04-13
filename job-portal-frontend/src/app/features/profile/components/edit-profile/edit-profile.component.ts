import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile.component.html'
})
export class EditProfileComponent {
  @Input() profileForm!: FormGroup;
  @Input() isSaving = false;
  
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<void>();

  onCancel() {
    this.cancelEdit.emit();
  }

  onSubmit() {
    this.submitForm.emit();
  }

  isSubmitDisabled(): boolean {
    return this.isSaving || !this.profileForm || this.profileForm.invalid;
  }

  canShowSavingState(): boolean {
    return this.isSaving;
  }

  getSubmitLabel(): string {
    return this.isSaving ? 'Saving...' : 'Commit Secure Update';
  }

  getControl(name: string): AbstractControl | null {
    return this.profileForm?.get(name) ?? null;
  }

  hasDirtyChanges(): boolean {
    return !!this.profileForm?.dirty;
  }

  getStatusText(): string {
    if (this.isSaving) return 'Saving profile...';
    return this.hasDirtyChanges() ? 'Unsaved changes' : 'All changes saved';
  }
}
