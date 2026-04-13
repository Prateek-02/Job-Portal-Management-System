import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';
import { vi } from 'vitest';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    // Mock smooth scroll which isn't available in JSDOM cleanly
    window.scrollTo = vi.fn();

    await TestBed.configureTestingModule({
      imports: [PaginationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
  });

  describe('Normal working', () => {
    it('should calculate visible pages and item indices correctly', () => {
      component.currentPage = 2; // 3rd page (0-indexed)
      component.totalPages = 10;
      component.totalElements = 95;
      component.pageSize = 10;
      
      component.ngOnChanges(); // Trigger manual change detection for input changes

      expect(component.visiblePages).toEqual([0, 1, 2, 3, 4]); // max 5 visible
      expect(component.startItem).toBe(21);
      expect(component.endItem).toBe(30);
    });

    it('should emit pageChange and scroll uniquely to top when goTo is called', () => {
      const emitSpy = vi.spyOn(component.pageChange, 'emit');
      component.totalPages = 5;
      component.currentPage = 1;
      
      component.goTo(3);
      
      expect(emitSpy).toHaveBeenCalledWith(3);
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });

  describe('Boundary value', () => {
    it('should handle zero elements and negative calculation boundaries gracefully', () => {
      component.currentPage = 0;
      component.totalPages = 0;
      component.totalElements = 0;
      
      component.ngOnChanges();
      
      expect(component.visiblePages).toEqual([]);
      expect(component.startItem).toBe(0);
      expect(component.endItem).toBe(0);
    });

    it('should prevent emissions on boundary limits (< 0 or >= totalPages)', () => {
      const emitSpy = vi.spyOn(component.pageChange, 'emit');
      component.totalPages = 5;
      component.currentPage = 4;
      
      component.goTo(5); // Bound overflow
      component.goTo(-1); // Bound underflow
      component.goTo(4); // Same page ignores bounds check optimization
      
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('Exception handling', () => {
    it('should safely render without throwing exceptions on extreme NaN value injections', () => {
      component.currentPage = NaN;
      component.totalPages = NaN;
      
      expect(() => {
        component.ngOnChanges();
      }).not.toThrow();
      
      expect(component.visiblePages).toEqual([]); // Safe default
    });
  });
});
