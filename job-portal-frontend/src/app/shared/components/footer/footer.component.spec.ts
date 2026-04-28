import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Normal working
  it('should create the footer component correctly', () => {
    expect(component).toBeTruthy();
  });

  // Boundary value
  it('should render standard footer without inputs (stateless rendering performance)', () => {
    // Tests that boundary of having zero active inputs doesn't cause hidden lifecycle errors
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('footer')).toBeTruthy();
  });

  // Exception handling
  it('should cleanly handle forced change detection cycles without throwing ViewDestroyed exceptions', () => {
    expect(() => {
      fixture.detectChanges();
      fixture.destroy();
    }).not.toThrow();
  });

  it('should expose footer label helper', () => {
    expect(component.getFooterLabel()).toBe('footer');
  });

  it('should evaluate footer helper logic', () => {
    expect(component.getCopyrightYear(new Date('2025-01-01'))).toBe(2025);
    expect(component.getCopyrightYear()).toBe(new Date().getFullYear());
    expect(component.normalizeCompanyName('  Acme  ')).toBe('Acme');
    expect(component.normalizeCompanyName('')).toBe('Job Portal');
    expect(component.getFooterText('Acme')).toContain('Acme');
    expect(component.shouldShowDivider(0)).toBe(false);
    expect(component.shouldShowDivider(2)).toBe(true);
  });
});
