export interface Job {
  id: number;
  title: string;
  companyName: string;
  location: string;
  salary: number;
  experience: number;
  description: string;
  recruiterId: number;
  createdAt: string;
  jobType?: string;
  skills?: string[];
  status?: string;
}

export interface JobRequest {
  title: string;
  companyName: string;
  location: string;
  salary: number;
  experience: number;
  description: string;
  skills?: string[];
}

export interface JobFilter {
  title?: string;
  location?: string;
  companyName?: string;
  minSalary?: number;
  maxSalary?: number;
  minExperience?: number;
  maxExperience?: number;
  skills?: string[];
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  pageSize: number;
  pageNumber: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}
