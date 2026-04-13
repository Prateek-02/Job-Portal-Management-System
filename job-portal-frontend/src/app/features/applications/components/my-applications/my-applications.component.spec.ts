import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyApplicationsComponent } from './my-applications.component';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { DatePipe } from '@angular/common';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';

describe('MyApplicationsComponent', () => {
  let component: MyApplicationsComponent;
  let fixture: ComponentFixture<MyApplicationsComponent>;
  let apiServiceMock: any;
  let authServiceMock: any;

  beforeEach(async () => {
    apiServiceMock = {
      getMyApplications: vi.fn().mockReturnValue(of({ content: [] }))
    };
    
    authServiceMock = {
      getCurrentUser: vi.fn().mockReturnValue({ id: 10 })
    };

    vi.spyOn(ErrorHandlerUtil, 'getFriendlyError').mockReturnValue('Load applications failed gently');

    await TestBed.configureTestingModule({
      imports: [MyApplicationsComponent, DatePipe, PaginationComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    })
    .overrideComponent(MyApplicationsComponent, {
      set: { imports: [DatePipe], schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(MyApplicationsComponent);
    component = fixture.componentInstance;
  }

  describe('Lifecycle and Initialization (Normal / Boundary)', () => {
    it('should initialize and fetch applications matching basic metadata mapping explicitly natively', () => {
      apiServiceMock.getMyApplications.mockReturnValue(of({
        content: [{ id: 1, status: 'APPLIED' }, { id: 2, status: 'SHORTLISTED' }],
        totalElements: 2,
        totalPages: 1
      }));
      
      setupComponent();
      fixture.detectChanges();
      
      expect(apiServiceMock.getMyApplications).toHaveBeenCalledWith(0, 5);
      expect(component.applications.length).toBe(2);
      expect(component.isLoading).toBe(false);
      
      // Metadata check logic
      const metadataStr = localStorage.getItem('jp_app_metadata_10');
      expect(metadataStr).toBeDefined();
      const metaObj = JSON.parse(metadataStr!);
      expect(metaObj['1']).toBe('APPLIED');
    });

    it('should quietly bypass metadata modifications structurally handling broken contexts without crashing gracefully', () => {
      authServiceMock.getCurrentUser.mockReturnValue(null); // Unauthenticated boundary gracefully handled
      apiServiceMock.getMyApplications.mockReturnValue(of({ content: [{ id: 1, status: 'REJECTED' }] }));
      
      localStorage.removeItem('jp_app_metadata_10'); // clear existing
      
      setupComponent();
      fixture.detectChanges(); // attempts to load and trigger checkStatuses
      
      expect(component.applications.length).toBe(1);
      
      // Should NOT have created a metadata string for null user limit bounding
      const metadataStr = localStorage.getItem('jp_app_metadata_10');
      expect(metadataStr).toBeNull();
    });
  });

  describe('Exception Handling', () => {
    it('should intercept failing streams resolving internally against default mappings appropriately mapping friendly exceptions mapped seamlessly', () => {
      apiServiceMock.getMyApplications.mockReturnValue(throwError(() => new Error('Global breakdown limits mapped securely')));
      setupComponent();
      fixture.detectChanges();
      
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Load applications failed gently');
    });
  });

  describe('Formatting Constants', () => {
    it('should functionally mutate display types contextually accurately tracking logic structural conversions', () => {
      setupComponent();
      
      expect(component.statusLabel('UNDER_REVIEW')).toBe('UNDER REVIEW');
      expect(component.statusLabel(undefined as any)).toBe('APPLIED'); // Default bounding logic cleanly passed limits structurally
      
      expect(component.statusClass('REJECTED')).toContain('bg-red-500');
      expect(component.statusClass('INVALID_X' as any)).toContain('bg-gray-500');
    });
  });
});
