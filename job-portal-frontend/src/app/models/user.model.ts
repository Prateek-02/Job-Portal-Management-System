export type UserRole = 'JOB_SEEKER' | 'RECRUITER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  skills: string;
  role: UserRole;
  profileImageUrl: string;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string; // Added for automatic background token refreshing
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  message: string;
}

export interface RegisterResponse {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  message: string;
}

export interface UpdateProfileRequest {
  name: string;
  phone: string;
  bio: string;
  location: string;
  skills: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}
