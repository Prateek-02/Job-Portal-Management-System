import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  profileForm: FormGroup;

  isLoading = true;
  isEditing = false;
  isSaving = false;
  isUploadingImage = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.apiService.getProfile().subscribe({
      next: (data) => {
        this.user = data;
        this.profileForm.patchValue({
          name: this.user.name,
          phone: this.user.phone
        });
        // Update auth state with latest user details
        this.authService.refreshProfile().subscribe();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load profile details.';
        this.isLoading = false;
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.successMessage = '';
    this.errorMessage = '';

    // When cancelling edit, reset form to current user values
    if (!this.isEditing && this.user) {
      this.profileForm.patchValue({
        name: this.user.name,
        phone: this.user.phone
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const updateData = this.profileForm.value;

    this.apiService.updateProfile(updateData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.isEditing = false;
        this.isSaving = false;
        this.successMessage = 'Profile updated successfully!';
        this.authService.refreshProfile().subscribe();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.message || 'Failed to update profile.';
      }
    });
  }

  onImageSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      this.uploadProfileImage(file);
    }
  }

  uploadProfileImage(file: File): void {
    if (!this.user?.id) return;

    this.isUploadingImage = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('image', file);

    this.apiService.uploadProfileImage(this.user.id, formData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.isUploadingImage = false;
        this.successMessage = 'Profile image updated successfully!';
        this.authService.refreshProfile().subscribe();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.isUploadingImage = false;
        this.errorMessage = err.message || 'Failed to upload image. Must be a valid image file.';
      }
    });
  }
}
