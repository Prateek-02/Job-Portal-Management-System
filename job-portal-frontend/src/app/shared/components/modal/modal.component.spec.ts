import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';
import { vi } from 'vitest';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Normal working
  it('should emit close event when onClose is called directly or via backdrop click', () => {
    const emitSpy = vi.spyOn(component.modalClose, 'emit');
    
    component.onClose();
    expect(emitSpy).toHaveBeenCalledTimes(1);

    // Simulate backdrop click
    const mockBackdropClick = { target: { classList: { contains: (cls: string) => cls === 'modal-backdrop' } } } as any;
    component.onBackdropClick(mockBackdropClick);
    expect(emitSpy).toHaveBeenCalledTimes(2);
  });

  // Boundary value
  it('should accurately return tailwind max-widths for all boundary sizes', () => {
    component.size = 'sm';
    expect(component.modalSizeClass).toBe('max-w-md');
    
    component.size = 'md';
    expect(component.modalSizeClass).toBe('max-w-2xl'); // default mapping in the component

    component.size = 'lg';
    expect(component.modalSizeClass).toBe('max-w-4xl');
    
    component.size = 'xl';
    expect(component.modalSizeClass).toBe('max-w-6xl');
  });

  // Exception handling
  it('should ignore escape key events safely without throwing when modal is already closed', () => {
    component.isOpen = false;
    const emitSpy = vi.spyOn(component.modalClose, 'emit');
    
    // Should pass through handleEscape but not trigger anything
    expect(() => {
      component.handleEscape(new KeyboardEvent('keydown', { key: 'Escape' }));
    }).not.toThrow();
    
    expect(emitSpy).not.toHaveBeenCalled();
    
    // Conversely, if open, it emits safely
    component.isOpen = true;
    component.handleEscape(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });
});
