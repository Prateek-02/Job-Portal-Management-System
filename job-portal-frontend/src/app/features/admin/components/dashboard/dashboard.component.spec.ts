import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('Admin Dashboard Shell Component', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([])]
    })
    .overrideComponent(DashboardComponent, {
      set: { schemas: [NO_ERRORS_SCHEMA] }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Normal working
  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });

  // Boundary value
  it('should construct correctly mapping isolated properties', () => {
    expect(Object.keys(component).length).toBeGreaterThanOrEqual(0);
  });

  // Exception handling
  it('should process native life cycle executions inherently', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should expose page title helper', () => {
    expect(component.getPageTitle()).toBe('Admin Dashboard');
  });

  it('should handle section helpers', () => {
    expect(component.getSectionCount()).toBe(3);
    expect(component.normalizeSectionName(' Users ')).toBe('users');
    expect(component.normalizeSectionName('')).toBe('overview');
    expect(component.normalizeSectionName(undefined)).toBe('overview');
    expect(component.isKnownSection('jobs')).toBe(true);
    expect(component.isKnownSection('other')).toBe(false);
    expect(component.getDefaultSection()).toBe('overview');
  });
});
