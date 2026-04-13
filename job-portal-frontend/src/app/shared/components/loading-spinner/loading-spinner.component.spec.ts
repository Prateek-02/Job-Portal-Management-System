import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
  });

  // Normal working
  it('should create and assign correct default classes', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.message).toBe('Loading Celestial Data...');
    expect(component.containerClasses).toContain('flex-col items-center justify-center p-8');
    expect(component.spinnerSizeClass).toBe('w-20 h-20'); // default 'md'
  });

  // Boundary value
  it('should apply correct fullscreen and edge-case boundary sizes', () => {
    component.fullScreen = true;
    component.size = 'sm';
    fixture.detectChanges();
    
    expect(component.containerClasses).toContain('fixed inset-0 z-[9999]');
    expect(component.spinnerSizeClass).toBe('w-12 h-12');
    
    component.size = 'lg';
    fixture.detectChanges();
    expect(component.spinnerSizeClass).toBe('w-32 h-32');
  });

  // Exception handling (handling unknown string safely via typescript mapping)
  it('should fallback securely to default width if receiving unmapped boundary size exception simulation', () => {
    component.size = 'huge_invalid_size' as any;
    fixture.detectChanges();
    
    // The switch statement default block should catch this without JS exceptions
    expect(component.spinnerSizeClass).toBe('w-20 h-20');
  });
});
