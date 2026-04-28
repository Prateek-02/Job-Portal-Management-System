import { HttpErrorResponse } from '@angular/common/http';

/**
 * Converts raw HTTP/Angular errors into clean, user-friendly messages.
 * Never exposes URLs, status codes, or technical details to the user.
 */
export function getFriendlyError(err: any, context?: ErrorContext): string {
  // HttpErrorResponse from backend
  if (err instanceof HttpErrorResponse || err?.status !== undefined) {
    const status: number = err.status;
    const backendMsg: string = err.error?.message || err.error?.error || '';

    switch (status) {
      case 0:
        return 'Unable to connect to the server. Please check your internet connection.';
      case 400:
        return backendMsg || getFallback(context, '400');
      case 401:
        return getFallback(context, '401');
      case 403:
        return 'You don\'t have permission to do this.';
      case 404:
        return getFallback(context, '404');
      case 409:
        return backendMsg || getFallback(context, '409');
      case 422:
        return backendMsg || 'The information provided is invalid. Please check and try again.';
      case 429:
        return 'Too many attempts. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
        return 'Something went wrong on our end. Please try again shortly.';
      default:
        return getFallback(context, 'default');
    }
  }

  // Angular-generated raw message like "Http failure response for ..."
  const msg: string = typeof err === 'string' ? err : (err?.message || '');
  if (msg.toLowerCase().includes('http failure response')) {
    return getFallback(context, 'default');
  }

  // Clean backend string messages (short, human-readable)
  if (msg && msg.length < 120 && !msg.toLowerCase().includes('http') && !msg.includes('localhost')) {
    return msg;
  }

  return getFallback(context, 'default');
}

export type ErrorContext =
  | 'login'
  | 'register'
  | 'load_jobs'
  | 'load_applications'
  | 'load_users'
  | 'apply_job'
  | 'post_job'
  | 'update_profile'
  | 'upload_image'
  | 'delete_user'
  | 'delete_job'
  | 'update_status'
  | 'load_profile'
  | string;

function getFallback(context: ErrorContext | undefined, errorType: string): string {
  // Context + error type specific messages
  if (context === 'login') {
    if (errorType === '401' || errorType === '404') return 'Invalid email or password.';
    if (errorType === '400') return 'Please enter a valid email and password.';
  }

  if (context === 'register') {
    if (errorType === '409') return 'An account with this email already exists.';
    if (errorType === '400') return 'Please check your details and try again.';
  }

  if (context === 'apply_job') {
    if (errorType === '409') return 'You have already applied for this job.';
    if (errorType === '404') return 'This job no longer exists.';
    if (errorType === '401') return 'Please sign in to apply for this job.';
    return 'Failed to submit your application. Please try again.';
  }

  if (context === 'post_job') {
    if (errorType === '401' || errorType === '403') return 'You must be logged in as a recruiter to post jobs.';
    return 'Failed to post the job. Please check your details and try again.';
  }

  if (context === 'update_profile') {
    return 'Failed to update your profile. Please try again.';
  }

  if (context === 'upload_image') {
    return 'Image upload failed. Please use a JPG or PNG under 5MB.';
  }

  if (context === 'load_jobs') return 'Failed to load jobs. Please refresh the page.';
  if (context === 'load_applications') return 'Failed to load applications. Please refresh the page.';
  if (context === 'load_users') return 'Failed to load users. Please refresh the page.';
  if (context === 'delete_user') return 'Failed to delete user. Please try again.';
  if (context === 'delete_job') return 'Failed to delete job. Please try again.';
  if (context === 'update_status') return 'Failed to update status. Please try again.';
  if (context === 'load_profile') return 'Failed to load profile. Please refresh the page.';

  // Generic 401/403
  if (errorType === '401') return 'Your session has expired. Please sign in again.';
  if (errorType === '404') return 'The requested item could not be found.';

  return 'Something went wrong. Please try again.';
}
