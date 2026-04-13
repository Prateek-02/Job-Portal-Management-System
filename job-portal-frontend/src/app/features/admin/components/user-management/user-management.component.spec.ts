import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserManagementComponent } from './user-management.component';
import { ApiService } from '../../../../core/services/api.service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';
import { provideRouter } from '@angular/router';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;
  let apiServiceMock: any;

  beforeEach(async () => {
    apiServiceMock = {
      getAdminUsers: vi.fn(),
      deleteUser: vi.fn()
    };

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    // ErrorHandlerUtil is mocked at top level

    await TestBed.configureTestingModule({
      imports: [UserManagementComponent, DatePipe, PaginationComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
  }

  describe('Paging and Loading Sequences (Normal / Exception)', () => {
    it('should natively retrieve user lists cleanly mapping observables dynamically', () => {
      apiServiceMock.getAdminUsers.mockReturnValue(of({ content: [{ id: 1, name: 'John', email: 'john@example.com', role: 'JOB_SEEKER', createdAt: '2026-04-01' }], totalElements: 1, totalPages: 1 }));
      setupComponent();
      fixture.detectChanges();
      
      expect(apiServiceMock.getAdminUsers).toHaveBeenCalledWith(0, 10);
      expect(component.users.length).toBe(1);
      expect(component.isLoading).toBe(false);
    });

    it('should process user navigation requests identically fetching bounds automatically', () => {
      apiServiceMock.getAdminUsers.mockReturnValue(of({ content: [], totalElements: 0, totalPages: 0 }));
      setupComponent();
      fixture.detectChanges();
      
      component.onPageChange(2);
      expect(component.currentPage).toBe(2);
      expect(apiServiceMock.getAdminUsers).toHaveBeenCalledWith(2, 10);
    });

    it('should propagate API failing user fetches smoothly delegating UI blocks cleanly securely', () => {
      apiServiceMock.getAdminUsers.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      setupComponent();
      fixture.detectChanges();
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Something went wrong on our end. Please try again shortly.');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Deletion Strategy & CSS Bindings (Boundary / Exception / Normal)', () => {
    it('should boundary protect bypass deletions natively when prompt maps confirm inherently false manually', () => {
      apiServiceMock.getAdminUsers.mockReturnValue(of({ content: [{ id: 10, name: 'A', email: 'a@example.com', role: 'JOB_SEEKER', createdAt: '2026-04-01' }] }));
      setupComponent();
      fixture.detectChanges();
      
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      component.deleteUser(10);
      
      expect(apiServiceMock.deleteUser).not.toHaveBeenCalled();
    });

    it('should trigger user delete correctly mutating structural limits seamlessly mapped internally', () => {
      apiServiceMock.getAdminUsers.mockReturnValue(of({ content: [{ id: 10, name: 'A', email: 'a@example.com', role: 'JOB_SEEKER', createdAt: '2026-04-01' }, { id: 20, name: 'B', email: 'b@example.com', role: 'RECRUITER', createdAt: '2026-04-01' }] }));
      apiServiceMock.deleteUser.mockReturnValue(of({}));
      setupComponent();
      fixture.detectChanges();
      
      component.deleteUser(10);
      
      expect(apiServiceMock.deleteUser).toHaveBeenCalledWith(10);
      expect(component.deletingId).toBeNull();
      expect(component.users.length).toBe(1);
      expect(component.users[0].id).toBe(20);
    });

    it('should throw UI intercept exception alerts propagating errors gracefully unblocking locks logically dynamically', () => {
      apiServiceMock.getAdminUsers.mockReturnValue(of({ content: [{ id: 10, name: 'A', email: 'a@example.com', role: 'JOB_SEEKER', createdAt: '2026-04-01' }] }));
      apiServiceMock.deleteUser.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      setupComponent();
      fixture.detectChanges();
      
      component.deleteUser(10);
      
      expect(window.alert).toHaveBeenCalledWith('Something went wrong on our end. Please try again shortly.');
      expect(component.deletingId).toBeNull();
      expect(component.users.length).toBe(1); // Undamaged structure bounds mapping
    });

    it('should compute css logic properly cleanly routing fallback boundaries effectively natively', () => {
      setupComponent();
      
      expect(component.roleClass('ADMIN')).toContain('bg-red-500');
      expect(component.roleClass('UNKNOWN_ROLE')).toContain('bg-gray-500');
    });
  });
});
