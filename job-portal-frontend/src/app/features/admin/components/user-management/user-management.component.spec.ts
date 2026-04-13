import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserManagementComponent } from './user-management.component';
import { ApiService } from '../../../../core/services/api.service';
import { DatePipe } from '@angular/common';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import * as ErrorHandlerUtil from '../../../../core/utils/error-handler.util';

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
    vi.spyOn(ErrorHandlerUtil, 'getFriendlyError').mockImplementation((err, context) => `Err: ${context}`);

    await TestBed.configureTestingModule({
      imports: [UserManagementComponent, DatePipe, PaginationComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceMock }
      ]
    })
    .overrideComponent(UserManagementComponent, {
      set: { imports: [DatePipe], schemas: ['NO_ERRORS_SCHEMA' as any] }
    })
    .compileComponents();
  });

  function setupComponent() {
    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
  }

  describe('Paging and Loading Sequences (Normal / Exception)', () => {
    it('should natively retrieve user lists cleanly mapping observables dynamically', () => {
      apiServiceMock.getAdminUsers.mockReturnValue(of({ content: [{ id: 1 }], totalElements: 1, totalPages: 1 }));
      setupComponent();
      fixture.detectChanges();
      
      expect(apiServiceMock.getAdminUsers).toHaveBeenCalledWith(0, 10);
      expect(component.users.length).toBe(1);
      expect(component.isLoading).toBe(false);
    });

    it('should process user navigation requests identically fetching bounds automatically', () => {
      apiServiceMock.getAdminUsers.mockReturnValue(of({ content: [] }));
      setupComponent();
      fixture.detectChanges();
      
      component.onPageChange(2);
      expect(component.currentPage).toBe(2);
      expect(apiServiceMock.getAdminUsers).toHaveBeenCalledWith(2, 10);
    });

    it('should propagate API failing user fetches smoothly delegating UI blocks cleanly securely', () => {
      apiServiceMock.getAdminUsers.mockReturnValue(throwError(() => new Error('Broken')));
      setupComponent();
      fixture.detectChanges();
      
      expect(component.errorMessage).toBe('Err: load_users');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Deletion Strategy & CSS Bindings (Boundary / Exception / Normal)', () => {
    it('should boundary protect bypass deletions natively when prompt maps confirm inherently false manually', () => {
      apiServiceMock.getAdminUsers.mockReturnValue(of({ content: [{ id: 10 }] }));
      setupComponent();
      fixture.detectChanges();
      
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      component.deleteUser(10);
      
      expect(apiServiceMock.deleteUser).not.toHaveBeenCalled();
    });

    it('should trigger user delete correctly mutating structural limits seamlessly mapped internally', () => {
      apiServiceMock.getAdminUsers.mockReturnValue(of({ content: [{ id: 10 }, { id: 20 }] }));
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
      apiServiceMock.getAdminUsers.mockReturnValue(of({ content: [{ id: 10 }] }));
      apiServiceMock.deleteUser.mockReturnValue(throwError(() => new Error('Limit')));
      setupComponent();
      fixture.detectChanges();
      
      component.deleteUser(10);
      
      expect(window.alert).toHaveBeenCalledWith('Err: delete_user');
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
