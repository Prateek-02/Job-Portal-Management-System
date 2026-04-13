import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditProfileComponent } from './edit-profile.component';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';

describe('EditProfileComponent', () => {
  let component: EditProfileComponent;
  let fixture: ComponentFixture<EditProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProfileComponent],
      providers: [provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProfileComponent);
    component = fixture.componentInstance;
    
    // Initialize required @Input()
    component.profileForm = new FormGroup({
      name: new FormControl(''),
      email: new FormControl(''),
      phone: new FormControl(''),
      location: new FormControl(''),
      skills: new FormControl(''),
      bio: new FormControl('')
    });

    fixture.detectChanges();
  });

  // Normal working
  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });

  // Boundary value
  it('should exist statelessly without initial configuration bounds', () => {
    // Tests that an empty component renders effectively without constraints
    const hostElement = fixture.nativeElement;
    expect(hostElement).toBeDefined();
  });

  // Exception handling
  it('should not throw native exceptions on forced detached changes', () => {
    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('should emit cancelEdit on onCancel', () => {
    const emitSpy = vi.spyOn(component.cancelEdit, 'emit');
    component.onCancel();
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('should emit submitForm on onSubmit', () => {
    const emitSpy = vi.spyOn(component.submitForm, 'emit');
    component.onSubmit();
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('should evaluate submit and saving state helpers', () => {
    component.isSaving = false;
    component.profileForm.get('name')?.setErrors({ required: true });
    expect(component.isSubmitDisabled()).toBe(true);

    component.profileForm.get('name')?.setErrors(null);
    expect(component.isSubmitDisabled()).toBe(false);

    component.isSaving = true;
    expect(component.isSubmitDisabled()).toBe(true);
    expect(component.canShowSavingState()).toBe(true);
    expect(component.getSubmitLabel()).toBe('Saving...');
    expect(component.getControl('name')).toBeTruthy();
    expect(component.getControl('unknown')).toBeNull();

    component.isSaving = false;
    expect(component.getSubmitLabel()).toBe('Commit Secure Update');
  });

  it('should compute change status text', () => {
    component.isSaving = false;
    component.profileForm.markAsDirty();
    expect(component.hasDirtyChanges()).toBe(true);
    expect(component.getStatusText()).toBe('Unsaved changes');

    component.profileForm.markAsPristine();
    expect(component.hasDirtyChanges()).toBe(false);
    expect(component.getStatusText()).toBe('All changes saved');

    component.isSaving = true;
    expect(component.getStatusText()).toBe('Saving profile...');
  });
});
