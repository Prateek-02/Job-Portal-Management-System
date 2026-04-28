import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthLayoutComponent } from './auth-layout.component';
import { RouterOutlet, provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AuthLayoutComponent', () => {
  let component: AuthLayoutComponent;
  let fixture: ComponentFixture<AuthLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLayoutComponent],
      providers: [provideRouter([])]
    }).compileComponents();
    
    fixture = TestBed.createComponent(AuthLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Normal working
  it('should create auth layout component', () => {
    expect(component).toBeTruthy();
  });

  // Boundary value / Exception handling proxy
  it('should structurally mount router outlet without any logic exceptions', () => {
    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('should expose auth layout helper', () => {
    expect(component.getLayoutType()).toBe('auth');
  });

  it('should evaluate auth layout helpers', () => {
    expect(component.getContainerClass()).toBe('auth-layout');
    expect(component.normalizeRedirect(' /signup ')).toBe('/signup');
    expect(component.normalizeRedirect('')).toBe('/login');
    expect(component.normalizeRedirect(undefined)).toBe('/login');
    expect(component.shouldUseCompactLayout(500)).toBe(true);
    expect(component.shouldUseCompactLayout(768)).toBe(false);
    expect(component.shouldUseCompactLayout(1200)).toBe(false);
    expect(component.getDefaultRedirect()).toBe('/login');
  });
});
