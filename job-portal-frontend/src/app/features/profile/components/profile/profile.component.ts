import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm!: FormGroup;

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
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
      bio: [''],
      location: [''],
      skills: ['']
    });
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.apiService.getProfile().subscribe({
      next: (user: User) => {
        this.user = user;
        this.profileForm.patchValue({
          name: user.name,
          phone: user.phone,
          bio: user.bio,
          location: user.location,
          skills: user.skills
        });
        this.isLoading = false;
      },
      error: () => { this.errorMessage = 'Failed to load profile.'; this.isLoading = false; }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.successMessage = '';
    this.errorMessage = '';
    if (!this.isEditing && this.user) {
      this.profileForm.patchValue({ name: this.user.name, phone: this.user.phone, bio: this.user.bio, location: this.user.location, skills: this.user.skills });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.isSaving = true;

    this.apiService.updateProfile(this.profileForm.value).subscribe({
      next: (updated: User) => {
        this.user = updated;
        this.isEditing = false;
        this.isSaving = false;
        this.successMessage = 'Profile updated successfully!';
        this.authService.refreshProfile().subscribe();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err: any) => { this.isSaving = false; this.errorMessage = err.message || 'Failed to update profile.'; }
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length && this.user?.id) {
      const formData = new FormData();
      formData.append('image', input.files[0]);
      this.isUploadingImage = true;

      this.apiService.uploadProfileImage(this.user.id, formData).subscribe({
        next: (updated: User) => {
          this.user = updated;
          this.isUploadingImage = false;
          this.successMessage = 'Profile picture updated!';
          this.authService.refreshProfile().subscribe();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err: any) => { this.isUploadingImage = false; this.errorMessage = err.message || 'Image upload failed.'; }
      });
    }
  }

  getSkillsList(): string[] {
    return this.user?.skills ? this.user.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  }
}
