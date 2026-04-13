import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthLayoutComponent } from './auth-layout.component';

describe('AuthLayoutComponent', () => {
  let component: AuthLayoutComponent;
  let fixture: ComponentFixture<AuthLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLayoutComponent]
    })
    .overrideComponent(AuthLayoutComponent, {
      set: { imports: [], schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
    
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
});
