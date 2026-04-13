import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()]
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

  describe('additional endpoint coverage', () => {
    it('should hit basic auth/profile endpoints', () => {
      service.register({ name: 'x' } as any).subscribe();
      httpMock.expectOne(`${apiUrl}/auth/register`).flush({ message: 'ok' });

      service.refreshToken('r1').subscribe();
      httpMock.expectOne(`${apiUrl}/auth/refresh`).flush({ accessToken: 'a' });

      service.forgotPassword('a@b.com').subscribe();
      httpMock.expectOne(`${apiUrl}/auth/forgot-password`).flush({ message: 'sent' });

      service.resetPassword('a@b.com', '111111', 'pass').subscribe();
      httpMock.expectOne(`${apiUrl}/auth/reset-password`).flush({ message: 'ok' });

      service.getProfile().subscribe();
      httpMock.expectOne(`${apiUrl}/auth/profile`).flush({});

      service.updateProfile({ name: 'Jane' } as any).subscribe();
      httpMock.expectOne(`${apiUrl}/auth/users/profile`).flush({});

      const fd = new FormData();
      service.uploadProfileImage(7, fd).subscribe();
      httpMock.expectOne(`${apiUrl}/auth/users/7/profile-image`).flush({});
    });

    it('should hit user/job CRUD endpoints with params', () => {
      service.getAllUsers(1, 20, 'name', 'asc').subscribe();
      const usersReq = httpMock.expectOne(r => r.url === `${apiUrl}/auth/users`);
      expect(usersReq.request.params.get('page')).toBe('1');
      usersReq.flush({ content: [] });

      service.getUserById(9).subscribe();
      httpMock.expectOne(`${apiUrl}/auth/users/9`).flush({});

      service.getJobById(11).subscribe();
      httpMock.expectOne(`${apiUrl}/jobs/11`).flush({});

      service.createJob({ title: 'Dev' } as any).subscribe();
      httpMock.expectOne(`${apiUrl}/jobs`).flush({});

      service.updateJob(11, { title: 'Dev2' } as any).subscribe();
      httpMock.expectOne(`${apiUrl}/jobs/11`).flush({});

      service.deleteJob(11).subscribe();
      httpMock.expectOne(`${apiUrl}/jobs/11`).flush({ message: 'ok' });
    });

    it('should hit search/recruiter/application/admin endpoints', () => {
      service.searchJobs({ title: 'java' } as any, 2, 5).subscribe();
      const searchReq = httpMock.expectOne(r => r.url === `${apiUrl}/jobs/search`);
      expect(searchReq.request.method).toBe('POST');
      expect(searchReq.request.params.get('page')).toBe('2');
      searchReq.flush({ content: [] });

      service.getJobsByRecruiter(5).subscribe();
      httpMock.expectOne(r => r.url === `${apiUrl}/jobs/recruiter/5`).flush({ content: [] });

      service.getMarketPulseStats().subscribe();
      httpMock.expectOne(`${apiUrl}/jobs/stats/market-pulse`).flush({});

      service.getMyApplications().subscribe();
      httpMock.expectOne(r => r.url === `${apiUrl}/applications/user/viewApplications`).flush({ content: [] });

      service.getJobApplications(9).subscribe();
      httpMock.expectOne(r => r.url === `${apiUrl}/applications/jobApplications/9`).flush({ content: [] });

      service.getAllRecruiterApplications().subscribe();
      httpMock.expectOne(r => r.url === `${apiUrl}/applications/recruiter`).flush({ content: [] });

      service.getTotalApplicationsCount().subscribe();
      httpMock.expectOne(`${apiUrl}/applications/count`).flush(5);

      service.deleteJobApplications(9).subscribe();
      httpMock.expectOne(`${apiUrl}/applications/job/9`).flush({ message: 'ok' });

      service.getAdminUsers().subscribe();
      httpMock.expectOne(r => r.url === `${apiUrl}/admin/users`).flush({ content: [] });

      service.getAdminUserById(4).subscribe();
      httpMock.expectOne(`${apiUrl}/admin/users/4`).flush({});

      service.deleteUser(4).subscribe();
      httpMock.expectOne(`${apiUrl}/admin/users/4`).flush({ message: 'ok' });

      service.getAdminJobs().subscribe();
      httpMock.expectOne(r => r.url === `${apiUrl}/admin/jobs`).flush({ content: [] });

      service.getAdminJobById(8).subscribe();
      httpMock.expectOne(`${apiUrl}/admin/jobs/8`).flush({});

      service.getAdminReports().subscribe();
      httpMock.expectOne(`${apiUrl}/admin/reports`).flush({});

      service.getPublicStats().subscribe();
      httpMock.expectOne(`${apiUrl}/admin/public/stats`).flush({});
    });

    it('should apply default query params for getAllUsers and searchJobs', () => {
      service.getAllUsers().subscribe();
      const usersReq = httpMock.expectOne(r => r.url === `${apiUrl}/auth/users`);
      expect(usersReq.request.params.get('page')).toBe('0');
      expect(usersReq.request.params.get('size')).toBe('10');
      expect(usersReq.request.params.get('sortBy')).toBe('id');
      expect(usersReq.request.params.get('direction')).toBe('desc');
      usersReq.flush({ content: [] });

      service.searchJobs({} as any).subscribe();
      const searchReq = httpMock.expectOne(r => r.url === `${apiUrl}/jobs/search`);
      expect(searchReq.request.params.get('page')).toBe('0');
      expect(searchReq.request.params.get('size')).toBe('10');
      expect(searchReq.request.params.get('sortBy')).toBe('createdAt');
      expect(searchReq.request.params.get('direction')).toBe('desc');
      searchReq.flush({ content: [] });
    });
  });
});
