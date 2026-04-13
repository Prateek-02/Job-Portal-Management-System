import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { provideRouter } from '@angular/router';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create structurally', () => {
    expect(component).toBeTruthy();
  });

  it('should keep default input flags false', () => {
    expect(component.isJobSeeker).toBe(false);
    expect(component.isRecruiter).toBe(false);
  });

  it('should accept user and role input values', () => {
    component.user = { id: 1, name: 'A' };
    component.isJobSeeker = true;
    component.isRecruiter = false;
    fixture.detectChanges();
    expect(component.user.id).toBe(1);
    expect(component.isJobSeeker).toBe(true);
    expect(component.isRecruiter).toBe(false);
  });

  it('should support direct class instantiation', () => {
    const direct = new SidebarComponent();
    expect(direct).toBeTruthy();
  });

  it('should compute display helpers', () => {
    component.user = { name: 'Alice' };
    component.isJobSeeker = true;
    expect(component.getInitial()).toBe('A');
    expect(component.getDisplayName()).toBe('Alice');
    expect(component.getRoleLabel()).toBe('Job Seeker');

    component.isJobSeeker = false;
    component.isRecruiter = true;
    expect(component.getRoleLabel()).toBe('Recruiter');

    component.user = null;
    component.isRecruiter = false;
    expect(component.getInitial()).toBe('U');
    expect(component.getDisplayName()).toBe('User Profile');
    expect(component.getRoleLabel()).toBe('System Admin');
  });
});
