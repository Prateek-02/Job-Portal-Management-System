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
}

export interface JobRequest {
  title: string;
  companyName: string;
  location: string;
  salary: number;
  experience: number;
  description: string;
}

export interface JobFilter {
  title?: string;
  location?: string;
  companyName?: string;
  minSalary?: number;
  maxSalary?: number;
  minExperience?: number;
  maxExperience?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}
