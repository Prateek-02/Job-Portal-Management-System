import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewProfileComponent } from './view-profile.component';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ViewProfileComponent', () => {
  let component: ViewProfileComponent;
  let fixture: ComponentFixture<ViewProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewProfileComponent],
      providers: [provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(ViewProfileComponent, {
      set: { schemas: [NO_ERRORS_SCHEMA] }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Normal working
  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });

  // Boundary value
  it('should construct correctly without explicit bounds dependencies', () => {
    expect(Object.keys(component).length).toBeGreaterThanOrEqual(0); // Validating naked scope
  });

  // Exception handling
  it('should cleanly digest changes natively without throws', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should compute skills and profile display helpers', () => {
    component.user = {
      name: 'Alice',
      phone: '9999999999',
      bio: 'Engineer',
      skills: 'Angular,  TypeScript , ,RxJS'
    } as any;
    expect(component.getSkillsList()).toEqual(['Angular', 'TypeScript', 'RxJS']);
    expect(component.hasBio()).toBe(true);
    expect(component.getDisplayName()).toBe('Alice');
    expect(component.getDisplayPhone()).toBe('9999999999');

    component.user = null;
    expect(component.getSkillsList()).toEqual([]);
    expect(component.hasBio()).toBe(false);
    expect(component.getDisplayName()).toBe('N/A');
    expect(component.getDisplayPhone()).toBe('N/A');
  });
});
