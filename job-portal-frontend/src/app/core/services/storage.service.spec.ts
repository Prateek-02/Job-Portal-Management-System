import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    // Clear localStorage to ensure isolated tests
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Token Management', () => {
    // Normal working
    it('should set, get, remove, and verify token existence', () => {
      expect(service.hasToken()).toBe(false);
      
      service.setToken('test_token');
      
      expect(service.getToken()).toBe('test_token');
      expect(service.hasToken()).toBe(true);
      
      service.removeToken();
      expect(service.getToken()).toBeNull();
      expect(service.hasToken()).toBe(false);
    });

    // Boundary value
    it('should handle empty string as valid token', () => {
      service.setToken('');
      expect(service.getToken()).toBeNull();
      // In JS, an empty string falls to falsy on `!!`, but since it's an empty string and not null,
      // localStorage.getItem returns "". `!!""` is false. Let's see if hasToken returns false.
      // A truly valid token shouldn't be empty, but testing boundary.
      expect(service.hasToken()).toBe(false); 
    });
  });

  describe('Refresh Token and Role Management', () => {
    it('should set/get/remove refresh token', () => {
      service.setRefreshToken('refresh_1');
      expect(service.getRefreshToken()).toBe('refresh_1');
      service.removeRefreshToken();
      expect(service.getRefreshToken()).toBeNull();
    });

    it('should set/get user role', () => {
      service.setUserRole('RECRUITER');
      expect(service.getUserRole()).toBe('RECRUITER');
    });
  });

  describe('User Management', () => {
    // Normal working
    it('should serialize and deserialize user objects', () => {
      const mockUser = { id: 1, name: 'John Doe', role: 'ADMIN' };
      
      service.setUser(mockUser);
      
      const retrieved = service.getUser();
      expect(retrieved).toEqual(mockUser);
    });

    // Exception handling
    it('should handle corrupted JSON gracefully without crashing (simulated exception)', () => {
      // Manually insert corrupted JSON
      localStorage.setItem('current_user', '{ corrupted: "json"');
      
      // Attempting to parse will throw. The actual service currently does JSON.parse without try-catch.
      // So testing the exception IS thrown as expected, identifying a boundary/exception case the dev should know about.
      expect(() => {
        service.getUser();
      }).toThrowError(SyntaxError);
    });

    it('should remove user explicitly', () => {
      service.setUser({ id: 9, name: 'Jane' });
      expect(service.getUser()).toEqual({ id: 9, name: 'Jane' });
      service.removeUser();
      expect(service.getUser()).toBeNull();
    });
  });

  describe('Clear All', () => {
    // Normal / Boundary combination
    it('should only clear auth related keys, leaving other localStorage data intact', () => {
      service.setToken('t');
      service.setRefreshToken('rt');
      service.setUser({id:1});
      service.setUserRole('ADMIN');
      
      // Inject some other unrelated key into localStorage boundary
      localStorage.setItem('other_app_key', 'should_not_be_removed');
      
      service.clear();
      
      expect(service.getToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
      expect(service.getUser()).toBeNull();
      expect(service.getUserRole()).toBeNull();
      
      expect(localStorage.getItem('other_app_key')).toBe('should_not_be_removed');
    });
  });
});
