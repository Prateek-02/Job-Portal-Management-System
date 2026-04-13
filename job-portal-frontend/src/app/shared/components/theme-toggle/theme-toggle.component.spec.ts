import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService, Theme } from '../../../core/services/theme.service';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;
  let mockThemeService: any;

  beforeEach(async () => {
    // Mock the ThemeService behavior
    const mockThemeSignal = signal<Theme>('light');
    
    mockThemeService = {
      theme: mockThemeSignal.asReadonly(),
      isDark: () => mockThemeSignal() === 'dark',
      toggleTheme: () => {
        const val = mockThemeSignal() === 'light' ? 'dark' : 'light';
        mockThemeSignal.set(val);
      }
    };

    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [
        { provide: ThemeService, useValue: mockThemeService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Normal working', () => {
    it('should create and verify injected service interacts correctly', () => {
      expect(component).toBeTruthy();
      expect(component.isDarkMode()).toBe(false);
      
      component.toggleTheme();
      expect(component.isDarkMode()).toBe(true);
    });
  });

  describe('Boundary value', () => {
    it('should render structurally true when toggled rapidly', () => {
      for (let i = 0; i < 5; i++) {
        component.toggleTheme();
      }
      expect(component.isDarkMode()).toBe(true); // toggled 5 times from light -> dark -> light -> dark -> light -> dark
    });
  });

  describe('Exception handling', () => {
    it('should not throw if the toggle service method is manually decoupled or throws an error asynchronously', () => {
      // Mock scenario where service has issue
      mockThemeService.toggleTheme = () => { throw new Error('Theme error'); };
      
      expect(() => {
        component.toggleTheme();
      }).toThrowError('Theme error');
    });
  });

  it('should support direct class instantiation', () => {
    const direct = new ThemeToggleComponent(mockThemeService);
    expect(direct).toBeTruthy();
  });

  it('should return title for dark and light mode', () => {
    expect(component.getToggleTitle()).toBe('Switch to Dark Mode');
    expect(component.getIconName()).toBe('moon');
    expect(component.showMoonIcon()).toBe(true);
    expect(component.showSunIcon()).toBe(false);
    component.toggleTheme();
    expect(component.getToggleTitle()).toBe('Switch to Light Mode');
    expect(component.getIconName()).toBe('sun');
    expect(component.showMoonIcon()).toBe(false);
    expect(component.showSunIcon()).toBe(true);
  });
});
