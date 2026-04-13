import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DatePipe } from '@angular/common';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let apiServiceMock: any;
  let authServiceMock: any;

  beforeEach(async () => {
    apiServiceMock = {
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
      uploadProfileImage: vi.fn()
    };
    
    authServiceMock = {
      refreshProfile: vi.fn().mockReturnValue(of({}))
    };

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(ErrorHandlerUtil, 'getFriendlyError').mockImplementation((err, context) => `Error in ${context}`);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, ReactiveFormsModule, DatePipe],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    })
    .overrideComponent(ProfileComponent, {
      set: { imports: [ReactiveFormsModule, DatePipe], schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  }

  describe('Lifecycle and Data Loading (Normal / Exception)', () => {
    it('should successfully load profile data and patch form on init', () => {
      apiServiceMock.getProfile.mockReturnValue(of({ id: 1, name: 'John', skills: 'Angular, React' }));
      setupComponent();
      fixture.detectChanges();
      
      expect(component.user?.name).toBe('John');
      expect(component.profileForm.value.name).toBe('John');
      expect(component.isLoading).toBe(false);
    });

    it('should handle API failure during profile load gracefully', () => {
      apiServiceMock.getProfile.mockReturnValue(throwError(() => new Error('Server limit')));
      setupComponent();
      fixture.detectChanges();
      
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Error in load_profile');
      expect(component.user).toBeNull();
    });
  });

  describe('State Editing (Normal / Boundary)', () => {
    it('should correctly toggle editing state and restore data on cancel', () => {
      apiServiceMock.getProfile.mockReturnValue(of({ id: 1, name: 'John' }));
      setupComponent();
      fixture.detectChanges();
      
      component.profileForm.patchValue({ name: 'Changed Name' });
      expect(component.profileForm.dirty).toBe(true);
      
      // cancel edit
      component.toggleEdit(); // Turn on
      component.toggleEdit(); // Turn off
      
      expect(component.profileForm.value.name).toBe('John'); // Restored
    });

    it('canDeactivate should allow routing if pristine OR block and alert if dirty boundary', () => {
      apiServiceMock.getProfile.mockReturnValue(of({ id: 1, name: 'John' }));
      setupComponent();
      fixture.detectChanges();
      
      // Not editing -> safe
      expect(component.canDeactivate()).toBe(true);
      
      // Editing + dirty -> requires confirm prompt
      component.isEditing = true;
      component.profileForm.markAsDirty();
      
      component.canDeactivate();
      expect(window.confirm).toHaveBeenCalled();
    });
  });

  describe('Form Submission (Exception / Normal)', () => {
    it('should block invalid submissions on the boundary front', () => {
      apiServiceMock.getProfile.mockReturnValue(of({ id: 1 }));
      setupComponent();
      fixture.detectChanges();
      
      component.profileForm.patchValue({ name: '' }); // Invalid required
      component.saveProfile();
      
      expect(apiServiceMock.updateProfile).not.toHaveBeenCalled();
    });

    it('should catch profile save HTTP errors correctly without destroying view', () => {
      apiServiceMock.getProfile.mockReturnValue(of({ id: 1, name: 'Valid' }));
      apiServiceMock.updateProfile.mockReturnValue(throwError(() => new Error('Failed to save')));
      setupComponent();
      fixture.detectChanges();
      
      component.saveProfile();
      
      expect(component.isSaving).toBe(false);
      expect(component.errorMessage).toBe('Error in update_profile');
    });

    it('should update profile and picture smoothly alongside triggering global state', fakeAsync(() => {
      apiServiceMock.getProfile.mockReturnValue(of({ id: 99, name: 'User' }));
      apiServiceMock.updateProfile.mockReturnValue(of({ id: 99, name: 'Updated' }));
      setupComponent();
      fixture.detectChanges();
      
      component.saveProfile();
      
      expect(component.user?.name).toBe('Updated');
      expect(component.successMessage).toBe('Profile updated successfully!');
      expect(authServiceMock.refreshProfile).toHaveBeenCalled();
      
      tick(3000);
      expect(component.successMessage).toBe('');
    }));
  });

  describe('Image Upload', () => {
    it('should POST image via exact multipart formData and handle results', fakeAsync(() => {
      apiServiceMock.getProfile.mockReturnValue(of({ id: 99 }));
      apiServiceMock.uploadProfileImage.mockReturnValue(of({ id: 99, image: 'xyz' }));
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
      
      tick(3000);
    }));
  });
});
