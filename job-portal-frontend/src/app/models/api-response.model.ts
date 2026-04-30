// Admin user response
export interface AdminUserResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

// Admin job response
export interface AdminJobResponse {
  id: number;
  title: string;
  companyName: string;
  location: string;
  salary: number;
  experience: number;
  description: string;
  recruiterId: number;
  createdAt: string;
  jobType: string;
}

// Admin page response (generic)
export interface AdminPageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  pageSize: number;
  pageNumber: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

// Admin reports - Map<String, Object> from backend
export interface AdminReports {
  totalUsers?: number;
  totalJobs?: number;
  totalApplications?: number;
  recruiters?: number;
  jobSeekers?: number;
  [key: string]: any;
}
