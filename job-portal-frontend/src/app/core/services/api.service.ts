import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8085/api';

  constructor(private http: HttpClient) { }

  // ============ AUTH ENDPOINTS ============
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials);
  }

  signup(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {});
  }

  resetPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { email });
  }

  uploadProfileImage(userId: string | number, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/users/${userId}/profile-image`, formData);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/profile`);
  }

  updateProfile(userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/users/profile`, userData);
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/users`);
  }

  getUserById(id: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/users/${id}`);
  }

  // ============ JOB ENDPOINTS ============
  getJobs(page: number = 0, size: number = 10, sortBy: string = 'createdAt', direction: string = 'desc'): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get(`${this.apiUrl}/jobs`, { params });
  }

  searchJobs(filter: any, page: number = 0, size: number = 10, sortBy: string = 'createdAt', direction: string = 'desc'): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.post(`${this.apiUrl}/jobs/search`, filter, { params });
  }

  getJobById(id: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/jobs/${id}`);
  }

  createJob(jobData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs`, jobData);
  }

  updateJob(id: string | number, jobData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/jobs/${id}`, jobData);
  }

  deleteJob(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/jobs/${id}`);
  }

  deleteRecruiterJobs(recruiterId: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/jobs/recruiter/${recruiterId}`);
  }

  // ============ APPLICATION ENDPOINTS ============
  applyForJob(jobId: string | number, resumeFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('jobId', jobId.toString());
    formData.append('resume', resumeFile);
    return this.http.post(`${this.apiUrl}/applications/apply`, formData);
  }

  getMyApplications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/applications/user/viewApplications`);
  }

  getJobApplications(jobId: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/applications/jobApplications/${jobId}`);
  }

  updateApplicationStatus(id: string | number, status: string): Observable<any> {
    const params = new HttpParams().set('status', status);
    return this.http.patch(`${this.apiUrl}/applications/jobApplication/${id}/status`, null, { params });
  }

  deleteJobApplications(jobId: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/applications/job/${jobId}`);
  }

  getTotalApplicationsCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/applications/count`);
  }

  // ============ ADMIN ENDPOINTS ============
  getAdminUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users`);
  }

  getAdminUserById(id: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users/${id}`);
  }

  deleteUser(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${id}`);
  }

  getAdminJobs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/jobs`);
  }

  getAdminJobById(id: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/jobs/${id}`);
  }

  getAdminReports(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/reports`);
  }
}
