import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('login()', () => {
    // Normal working
    it('should successfully login user and return LoginResponse', () => {
      const mockReq = { email: 'test@test.com', password: 'password123' };
      const mockRes = { token: 'mockToken', refreshToken: 'mockRefresh', user: { id: 1, email: 'test@test.com' } as any };

      service.login(mockReq).subscribe(res => {
        expect(res).toEqual(mockRes);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockRes);
    });

    // Boundary value
    it('should handle unusual but valid inputs (e.g. max length strings) without crashing frontend logic', () => {
      const longString = 'a'.repeat(255);
      const mockReq = { email: `${longString}@test.com`, password: longString };
      const mockRes = { token: 'mockToken', refreshToken: 'mockRefresh', user: { id: 1, email: mockReq.email } as any };

      service.login(mockReq).subscribe(res => {
        expect(res).toEqual(mockRes);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.email).toEqual(mockReq.email);
      req.flush(mockRes);
    });

    // Exception handling
    it('should handle unauthorized error gracefully', () => {
      const mockReq = { email: 'test@test.com', password: 'wrongpassword' };
      
      service.login(mockReq).subscribe({
        next: () => { throw new Error('should have failed with 401 error'); },
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(401);
          expect(error.statusText).toEqual('Unauthorized');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      req.flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('getJobs()', () => {
    // Normal working
    it('should retrieve page of jobs with default pagination', () => {
      const mockRes = { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 } as any;

      service.getJobs().subscribe(res => {
        expect(res).toEqual(mockRes);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${apiUrl}/jobs` &&
        request.params.get('page') === '0' &&
        request.params.get('size') === '10' &&
        request.params.get('sortBy') === 'createdAt' &&
        request.params.get('direction') === 'desc'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockRes);
    });

    // Boundary value
    it('should retrieve jobs with extreme pagination values (boundary)', () => {
      const mockRes = { content: [], totalElements: 1000, totalPages: 10, size: 100, number: 9 } as any;

      service.getJobs(9, 100, 'title', 'asc').subscribe(res => {
        expect(res).toEqual(mockRes);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${apiUrl}/jobs` &&
        request.params.get('page') === '9' &&
        request.params.get('size') === '100' &&
        request.params.get('sortBy') === 'title' &&
        request.params.get('direction') === 'asc'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockRes);
    });

    // Exception handling
    it('should handle internal server error (500) gracefully', () => {
      service.getJobs().subscribe({
        next: () => { throw new Error('should have failed with 500 error'); },
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toEqual('Internal Server Error');
        }
      });

      const req = httpMock.expectOne(request => request.url === `${apiUrl}/jobs`);
      req.flush('Server failed', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('applyForJob()', () => {
    // Normal working
    it('should post FormData to apply for job', () => {
      const file = new File([''], 'resume.pdf', { type: 'application/pdf' });
      const mockRes = { id: 1, status: 'APPLIED' } as any;

      service.applyForJob(101, file).subscribe(res => {
        expect(res).toEqual(mockRes);
      });

      const req = httpMock.expectOne(`${apiUrl}/applications/apply`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTruthy();
      expect(req.request.body.get('jobId')).toBe('101');
      expect(req.request.body.get('resume')).toBe(file);
      req.flush(mockRes);
    });

    // Boundary value
    it('should safely serialize very large jobId string values', () => {
      const file = new File([''], 'resume.pdf', { type: 'application/pdf' });
      const mockRes = { id: 1, status: 'APPLIED' } as any;
      const largeJobId = Number.MAX_SAFE_INTEGER;

      service.applyForJob(largeJobId, file).subscribe(res => {
        expect(res).toEqual(mockRes);
      });

      const req = httpMock.expectOne(`${apiUrl}/applications/apply`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.get('jobId')).toBe(String(largeJobId));
      req.flush(mockRes);
    });

    // Exception handling
    it('should handle large payload error (413 Payload Too Large)', () => {
      const file = new File([''], 'large_resume.pdf');
      
      service.applyForJob(101, file).subscribe({
        next: () => { throw new Error('should have failed with 413 error'); },
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(413);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/applications/apply`);
      req.flush('Payload Too Large', { status: 413, statusText: 'Payload Too Large' });
    });
  });

  describe('updateApplicationStatus()', () => {
    // Normal working
    it('should send PATCH request with status query param', () => {
      const mockRes = { id: 1, status: 'ACCEPTED' } as any;

      service.updateApplicationStatus(1, 'ACCEPTED' as any).subscribe(res => {
        expect(res).toEqual(mockRes);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${apiUrl}/applications/jobApplication/1/status` &&
        request.params.get('status') === 'ACCEPTED'
      );
      expect(req.request.method).toBe('PATCH');
      req.flush(mockRes);
    });

    // Boundary value / Invalid value check that API structure supports mapping
    it('should pass unmapped boundary ENUM strings without frontend modification', () => {
      const edgeCaseStatus = 'SOME_UNKNOWN_LONG_STATUS_NAME_123' as any;
      const mockRes = { id: 1, status: edgeCaseStatus };

      service.updateApplicationStatus(1, edgeCaseStatus).subscribe(res => {
        expect(res).toEqual(mockRes);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${apiUrl}/applications/jobApplication/1/status` &&
        request.params.get('status') === edgeCaseStatus
      );
      req.flush(mockRes);
    });

    // Exception handling
    it('should propagate 404 if application not found', () => {
      service.updateApplicationStatus(999, 'REJECTED' as any).subscribe({
        next: () => { throw new Error('should have failed with 404 error'); },
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(request => request.url === `${apiUrl}/applications/jobApplication/999/status`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
