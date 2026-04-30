import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DatePipe, CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';
import { provideRouter, Router } from '@angular/router';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { Observable } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let apiServiceMock: any;
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    apiServiceMock = {
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
      uploadProfileImage: vi.fn()
    };
    
    authServiceMock = {
      refreshProfile: vi.fn().mockReturnValue(of({}))
    };
    
    routerMock = { navigate: vi.fn() };

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, ReactiveFormsModule, DatePipe, CommonModule, ModalComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  }

  describe('Lifecycle and Data Loading (Normal / Exception)', () => {
    it('should successfully load profile data and patch form on init', () => {
      apiServiceMock.getProfile.mockReturnValue(of({ id: 1, name: 'John', role: 'JOB_SEEKER', phone: '1234567890', skills: 'Angular, React' }));
      setupComponent();
      fixture.detectChanges();
      
      expect(component.user?.name).toBe('John');
      expect(component.profileForm.value.name).toBe('John');
      expect(component.isLoading).toBe(false);
    });

    it('should handle API failure during profile load gracefully', () => {
      apiServiceMock.getProfile.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      setupComponent();
      fixture.detectChanges();
      
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
      expect(component.user).toBeNull();
    });
  });

  describe('State Editing (Normal / Boundary)', () => {
    it('should correctly toggle editing state and restore data on cancel', () => {
      apiServiceMock.getProfile.mockReturnValue(of({ id: 1, name: 'John', role: 'JOB_SEEKER', phone: '1234567890' }));
      setupComponent();
      fixture.detectChanges();
      
      component.profileForm.patchValue({ name: 'Changed Name' });
      expect(component.profileForm.value.name).toBe('Changed Name');
      
      // cancel edit
      component.toggleEdit(); // Turn on
      component.toggleEdit(); // Turn off
      
      expect(component.profileForm.value.name).toBe('John'); // Restored
    });

    it('canDeactivate should allow routing if pristine OR block and show custom modal if dirty', () => {
      apiServiceMock.getProfile.mockReturnValue(of({ id: 1, name: 'John', role: 'JOB_SEEKER', phone: '1234567890' }));
      setupComponent();
      fixture.detectChanges();
      
      // Not editing -> safe
      expect(component.canDeactivate()).toBe(true);
      
      // Editing + dirty -> requires custom modal
      component.isEditing = true;
      component.profileForm.markAsDirty();
      
      const deactivate$ = component.canDeactivate() as Observable<boolean>;
      expect(component.showDeactivateModal).toBe(true);
      
      let resolvedValue: boolean | undefined;
      deactivate$.subscribe((val: boolean) => resolvedValue = val);
      
      component.onConfirmDeactivate();
      expect(resolvedValue).toBe(true);
      expect(component.showDeactivateModal).toBe(false);
    });

    it('should stay on page when cancel is clicked in profile deactivate modal', () => {
      apiServiceMock.getProfile.mockReturnValue(of({ id: 1, name: 'John', role: 'JOB_SEEKER', phone: '1234567890' }));
      setupComponent();
      fixture.detectChanges();
      
      component.isEditing = true;
      component.profileForm.markAsDirty();
      
      const deactivate$ = component.canDeactivate() as Observable<boolean>;
      
      let resolvedValue: boolean | undefined;
      deactivate$.subscribe((val: boolean) => resolvedValue = val);
      
      component.onCancelDeactivate();
      expect(resolvedValue).toBe(false);
      expect(component.showDeactivateModal).toBe(false);
    });
  });

  describe('Form Submission (Exception / Normal)', () => {
    it('should block invalid submissions on the boundary front', () => {
      apiServiceMock.getProfile.mockReturnValue(of({ id: 1, name: 'John', role: 'JOB_SEEKER', phone: '1234567890' }));
      setupComponent();
      fixture.detectChanges();
      
      component.profileForm.patchValue({ name: '' }); // Invalid required
      component.saveProfile();
      
      expect(apiServiceMock.updateProfile).not.toHaveBeenCalled();
    });

    it('should catch profile save HTTP errors correctly without destroying view', () => {
      apiServiceMock.getProfile.mockReturnValue(of({ id: 1, name: 'Valid', role: 'JOB_SEEKER', phone: '1234567890' }));
      apiServiceMock.updateProfile.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      setupComponent();
      fixture.detectChanges();
      
      component.profileForm.patchValue({ name: 'Valid', phone: '1234567890' });
      component.saveProfile();
      
      expect(component.isSaving).toBe(false);
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
    });

    it('should update profile and picture smoothly alongside triggering global state', async () => {
      vi.useFakeTimers();
      apiServiceMock.getProfile.mockReturnValue(of({ id: 99, name: 'User', role: 'JOB_SEEKER', phone: '1234567890' }));
      apiServiceMock.updateProfile.mockReturnValue(of({ id: 99, name: 'Updated', role: 'JOB_SEEKER', phone: '1234567890' }));
      setupComponent();
      fixture.detectChanges();
      
      component.profileForm.patchValue({ name: 'Updated', phone: '1234567890' });
      component.saveProfile();
      
      expect(component.user?.name).toBe('Updated');
      expect(component.successMessage).toBe('Profile updated successfully!');
      expect(authServiceMock.refreshProfile).toHaveBeenCalled();
      
      await vi.advanceTimersByTimeAsync(3000);
      expect(component.successMessage).toBe('');
      vi.useRealTimers();
    });
  });

  describe('Image Upload', () => {
    it('should POST image via exact multipart formData and handle results', async () => {
      vi.useFakeTimers();
      apiServiceMock.getProfile.mockReturnValue(of({ id: 99, name: 'User', role: 'JOB_SEEKER', phone: '1234567890' }));
      apiServiceMock.uploadProfileImage.mockReturnValue(of({ id: 99, name: 'User', role: 'JOB_SEEKER', phone: '1234567890', profileImageUrl: 'xyz' }));
      setupComponent();
      fixture.detectChanges();
      
      // Simulate file input
      const file = new File([''], 'avatar.png', { type: 'image/png' });
      const ev = { target: { files: [file] } } as any;
      
      component.onImageSelected(ev);
      
      expect(apiServiceMock.uploadProfileImage).toHaveBeenCalled();
      expect(component.isUploadingImage).toBe(false);
      expect(component.successMessage).toBe('Profile picture updated!');
      expect(authServiceMock.refreshProfile).toHaveBeenCalled();
      
      await vi.advanceTimersByTimeAsync(3000);
      vi.useRealTimers();
    });

    it('should handle image upload errors gracefully', () => {
      apiServiceMock.getProfile.mockReturnValue(of({ id: 99, name: 'User', role: 'JOB_SEEKER' }));
      apiServiceMock.uploadProfileImage.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      setupComponent();
      fixture.detectChanges();
      
      const ev = { target: { files: [new File([''], 'a.png')] } } as any;
      component.onImageSelected(ev);
      
      expect(component.isUploadingImage).toBe(false);
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
    });
  });
});
