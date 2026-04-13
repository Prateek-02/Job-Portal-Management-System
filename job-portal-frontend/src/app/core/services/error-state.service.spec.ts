import { TestBed } from '@angular/core/testing';
import { ErrorStateService, HttpErrorState } from './error-state.service';

describe('ErrorStateService', () => {
  let service: ErrorStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorStateService);
  });

  // Normal working
  it('should set and get the error state correctly', () => {
    const mockError: HttpErrorState = {
      status: 404,
      message: 'Not Found',
      url: '/api/notfound',
      timestamp: new Date().toISOString()
    };

    service.set(mockError);
    const result = service.get();

    expect(result).toEqual(mockError);
  });

  // Boundary value
  it('should handle extremely large string payload in error state safely across boundary values', () => {
    const largeMessage = 'error_'.repeat(10000); 
    const mockError: HttpErrorState = {
      status: 500,
      message: largeMessage,
      url: '/api/fail',
      timestamp: new Date().toISOString()
    };

    service.set(mockError);
    const result = service.get();

    expect(result?.message.length).toEqual(60000); // 10000 * 6
    expect(result?.status).toBe(500);
  });

  // Exception handling / null boundary
  it('should handle clearing cleanly and return null without throwing exception', () => {
    const mockError: HttpErrorState = {
      status: 503,
      message: 'Service Unavailable',
      url: '/api/down',
      timestamp: new Date().toISOString()
    };

    service.set(mockError);
    expect(service.get()).not.toBeNull();
    
    // Test the clear/null safety boundary
    service.clear();
    
    expect(() => service.get()).not.toThrow();
    expect(service.get()).toBeNull();
  });

  it('should expose hasError helper state', () => {
    expect(service.hasError()).toBe(false);
    service.set({
      status: 400,
      message: 'Bad Request',
      url: '/api/x',
      timestamp: new Date().toISOString()
    });
    expect(service.hasError()).toBe(true);
    service.clear();
    expect(service.hasError()).toBe(false);
  });

  it('should expose derived helper methods', () => {
    expect(service.getStatusCode()).toBe(0);
    expect(service.getStatusCode(7)).toBe(7);
    expect(service.getMessageOrFallback()).toBe('Unknown error');
    expect(service.isServerError()).toBe(false);

    service.set({
      status: 503,
      message: ' Service unavailable ',
      url: '/api/health',
      timestamp: new Date().toISOString()
    });

    expect(service.getStatusCode()).toBe(503);
    expect(service.getMessageOrFallback()).toBe('Service unavailable');
    expect(service.getMessageOrFallback('fallback')).toBe('Service unavailable');
    expect(service.isServerError()).toBe(true);
    expect(service.toLogString()).toContain('[503] Service unavailable @ /api/health');
  });
});
