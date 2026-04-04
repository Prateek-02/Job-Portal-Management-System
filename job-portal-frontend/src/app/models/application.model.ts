export type ApplicationStatus = 'APPLIED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED';

// Job info embedded in ApplicationResponse
export interface ApplicationJobInfo {
  id: number;
  title: string;
  companyName: string;
  salary: number;
  location: string;
  recruiterId: number;
}

// Returned for JOB_SEEKER - viewApplications
export interface ApplicationResponse {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  resumeUrl: string;
  status: ApplicationStatus;
  appliedAt: string;
  job: ApplicationJobInfo;
}

// Returned for RECRUITER - jobApplications/{jobId}
export interface JobApplicationResponse {
  id: number;
  userId: number;
  jobId: number;
  resumeUrl: string;
  status: ApplicationStatus;
  appliedAt: string;
  applicantName: string;
  applicantEmail: string;
  jobTitle?: string;
  companyName?: string;
}
