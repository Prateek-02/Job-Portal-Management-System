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
}

// Admin page response (for jobs)
export interface AdminPageResponse {
  content: AdminJobResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

// Admin reports - Map<String, Object> from backend
export interface AdminReports {
  totalUsers?: number;
  totalJobs?: number;
  totalApplications?: number;
  [key: string]: any;
}
