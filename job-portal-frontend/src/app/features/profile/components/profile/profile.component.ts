import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CanComponentDeactivate } from '../../../../core/guards/can-deactivate.guard';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../models/user.model';
import { getFriendlyError } from '../../../../core/utils/error-handler.util';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EditProfileComponent } from '../edit-profile/edit-profile.component';
import { ViewProfileComponent } from '../view-profile/view-profile.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, EditProfileComponent, ViewProfileComponent, ModalComponent],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit, OnDestroy, CanComponentDeactivate {
  user: User | null = null;
  profileForm!: FormGroup;

  isLoading = true;
  isEditing = false;
  isSaving = false;
  isUploadingImage = false;
  successMessage = '';
  errorMessage = '';
  showDeactivateModal = false;
  private deactivateSubject?: Subject<boolean>;

  private destroy$ = new Subject<void>();

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  canDeactivate(): Observable<boolean> | boolean {
    if (this.isEditing && this.profileForm.dirty && !this.isSaving) {
      this.showDeactivateModal = true;
      this.deactivateSubject = new Subject<boolean>();
      return this.deactivateSubject.asObservable();
    }
    return true;
  }

  onConfirmDeactivate(): void {
    this.showDeactivateModal = false;
    this.deactivateSubject?.next(true);
    this.deactivateSubject?.complete();
  }

  onCancelDeactivate(): void {
    this.showDeactivateModal = false;
    this.deactivateSubject?.next(false);
    this.deactivateSubject?.complete();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.apiService.getProfile().pipe(takeUntil(this.destroy$)).subscribe({
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
      error: (err) => { this.errorMessage = getFriendlyError(err, 'load_profile'); this.isLoading = false; }
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

    this.apiService.updateProfile(this.profileForm.value).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated: User) => {
        this.user = updated;
        this.isEditing = false;
        this.isSaving = false;
        this.successMessage = 'Profile updated successfully!';
        this.authService.refreshProfile().pipe(takeUntil(this.destroy$)).subscribe();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err: any) => { this.isSaving = false; this.errorMessage = getFriendlyError(err, 'update_profile'); }
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length && this.user?.id) {
      const formData = new FormData();
      formData.append('image', input.files[0]);
      this.isUploadingImage = true;

      this.apiService.uploadProfileImage(this.user.id, formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (updated: User) => {
          this.user = updated;
          this.isUploadingImage = false;
          this.successMessage = 'Profile picture updated!';
          this.authService.refreshProfile().pipe(takeUntil(this.destroy$)).subscribe();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err: any) => { this.isUploadingImage = false; this.errorMessage = getFriendlyError(err, 'upload_image'); }
      });
    }
  }
}
