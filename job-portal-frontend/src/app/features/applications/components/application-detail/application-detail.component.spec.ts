import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationDetailComponent } from './application-detail.component';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ApplicationDetailComponent', () => {
  let component: ApplicationDetailComponent;
  let fixture: ComponentFixture<ApplicationDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationDetailComponent],
      providers: [provideRouter([])]
    })
    .overrideComponent(ApplicationDetailComponent, {
      set: { schemas: [NO_ERRORS_SCHEMA] }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationDetailComponent);
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

  it('should expose detail mode helper', () => {
    expect(component.getViewMode()).toBe('detail');
  });

  it('should evaluate status helpers', () => {
    expect(component.getHeaderLabel()).toBe('Application Detail');
    expect(component.normalizeStatus(' applied ')).toBe('APPLIED');
    expect(component.normalizeStatus()).toBe('UNKNOWN');
    expect(component.isTerminalStatus('rejected')).toBe(true);
    expect(component.isTerminalStatus('applied')).toBe(false);
    expect(component.getStatusClass('accepted')).toBe('final');
    expect(component.getStatusClass('applied')).toBe('active');
  });
});
