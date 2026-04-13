import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

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
}
