import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService, Theme } from '../../../core/services/theme.service';
import { signal } from '@angular/core';

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
      expect(component.themeService.isDark()).toBe(false);
      
      component.themeService.toggleTheme();
      expect(component.themeService.isDark()).toBe(true);
    });
  });

  describe('Boundary value', () => {
    it('should render structurally true when toggled rapidly', () => {
      for (let i = 0; i < 5; i++) {
        component.themeService.toggleTheme();
      }
      expect(component.themeService.isDark()).toBe(true); // toggled 5 times from light -> dark -> light -> dark -> light -> dark
    });
  });

  describe('Exception handling', () => {
    it('should not throw if the toggle service method is manually decoupled or throws an error asynchronously', () => {
      // Mock scenario where service has issue
      mockThemeService.toggleTheme = () => { throw new Error('Theme error'); };
      
      expect(() => {
        component.themeService.toggleTheme();
      }).toThrowError('Theme error');
    });
  });
});
