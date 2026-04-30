import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, LoginRequest, RegisterRequest, UpdateProfileRequest, User, RegisterResponse } from '../../models/user.model';
import { Job, JobFilter, JobRequest, PageResponse } from '../../models/job.model';
import { ApplicationResponse, ApplicationStatus, JobApplicationResponse } from '../../models/application.model';
import { AdminJobResponse, AdminPageResponse, AdminReports, AdminUserResponse } from '../../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ============ AUTH ENDPOINTS ============

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials);
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, userData);
  }

  refreshToken(token: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken: token });
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(email: string, otp: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, { email, otp, newPassword });
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/profile`);
  }

  updateProfile(request: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/auth/users/profile`, request);
  }

  uploadProfileImage(userId: number, formData: FormData): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/users/${userId}/profile-image`, formData);
  }

  getAllUsers(page = 0, size = 10, sortBy = 'id', direction = 'desc'): Observable<PageResponse<User>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<PageResponse<User>>(`${this.apiUrl}/auth/users`, { params });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/users/${id}`);
  }

  // ============ JOB ENDPOINTS ============

  getJobs(page = 0, size = 10, sortBy = 'createdAt', direction = 'desc'): Observable<PageResponse<Job>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<PageResponse<Job>>(`${this.apiUrl}/jobs`, { params });
  }

  getJobById(id: number): Observable<Job> {
    return this.http.get<Job>(`${this.apiUrl}/jobs/${id}`);
  }

  createJob(jobData: JobRequest): Observable<Job> {
    return this.http.post<Job>(`${this.apiUrl}/jobs`, jobData);
  }

  updateJob(id: number, jobData: JobRequest): Observable<Job> {
    return this.http.put<Job>(`${this.apiUrl}/jobs/${id}`, jobData);
  }

  deleteJob(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/jobs/${id}`);
  }

  searchJobs(filter: JobFilter, page = 0, size = 10, sortBy = 'createdAt', direction = 'desc'): Observable<PageResponse<Job>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.post<PageResponse<Job>>(`${this.apiUrl}/jobs/search`, filter, { params });
  }

  // ============ JOB ENDPOINTS (CONTINUED) ============
  
  getJobsByRecruiter(recruiterId: number, page = 0, size = 10, sortBy = 'createdAt', direction = 'desc'): Observable<PageResponse<Job>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<PageResponse<Job>>(`${this.apiUrl}/jobs/recruiter/${recruiterId}`, { params });
  }

  getMarketPulseStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/jobs/stats/market-pulse`);
  }

  // ============ APPLICATION ENDPOINTS ============

  applyForJob(jobId: number, resumeFile: File): Observable<ApplicationResponse> {
    const formData = new FormData();
    formData.append('jobId', jobId.toString());
    formData.append('resume', resumeFile);
    return this.http.post<ApplicationResponse>(`${this.apiUrl}/applications/apply`, formData);
  }

  getMyApplications(page = 0, size = 10, sortBy = 'appliedAt', direction = 'desc'): Observable<PageResponse<ApplicationResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<PageResponse<ApplicationResponse>>(`${this.apiUrl}/applications/user/viewApplications`, { params });
  }

  getJobApplications(jobId: number, page = 0, size = 10, sortBy = 'appliedAt', direction = 'desc'): Observable<PageResponse<JobApplicationResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<PageResponse<JobApplicationResponse>>(`${this.apiUrl}/applications/jobApplications/${jobId}`, { params });
  }

  getAllRecruiterApplications(page = 0, size = 10, sortBy = 'appliedAt', direction = 'desc'): Observable<PageResponse<JobApplicationResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<PageResponse<JobApplicationResponse>>(`${this.apiUrl}/applications/recruiter`, { params });
  }

  updateApplicationStatus(appId: number, status: ApplicationStatus): Observable<ApplicationResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<ApplicationResponse>(
      `${this.apiUrl}/applications/jobApplication/${appId}/status`,
      null,
      { params }
    );
  }

  getTotalApplicationsCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/applications/count`);
  }

  checkHasApplied(jobId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/applications/check/${jobId}`);
  }

  deleteJobApplications(jobId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/applications/job/${jobId}`);
  }

  // ============ ADMIN ENDPOINTS ============

  getAdminUsers(page = 0, size = 10, sortBy = 'id', direction = 'desc'): Observable<AdminPageResponse<AdminUserResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<AdminPageResponse<AdminUserResponse>>(`${this.apiUrl}/admin/users`, { params });
  }

  getAdminUserById(id: number): Observable<AdminUserResponse> {
    return this.http.get<AdminUserResponse>(`${this.apiUrl}/admin/users/${id}`);
  }

  deleteUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/users/${id}`);
  }

  getAdminJobs(page = 0, size = 10, sortBy = 'createdAt', direction = 'desc'): Observable<AdminPageResponse<AdminJobResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<AdminPageResponse<AdminJobResponse>>(`${this.apiUrl}/admin/jobs`, { params });
  }

  getAdminJobById(id: number): Observable<AdminJobResponse> {
    return this.http.get<AdminJobResponse>(`${this.apiUrl}/admin/jobs/${id}`);
  }

  getAdminReports(): Observable<AdminReports> {
    return this.http.get<AdminReports>(`${this.apiUrl}/admin/reports`);
  }

  getPublicStats(): Observable<AdminReports> {
    return this.http.get<AdminReports>(`${this.apiUrl}/admin/public/stats`);
  }
}
