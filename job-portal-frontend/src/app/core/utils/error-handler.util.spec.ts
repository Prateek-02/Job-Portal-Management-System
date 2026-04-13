import { HttpErrorResponse } from '@angular/common/http';
import { getFriendlyError } from './error-handler.util';

describe('getFriendlyError', () => {
  it('should map network error status 0', () => {
    expect(getFriendlyError({ status: 0 })).toBe(
      'Unable to connect to the server. Please check your internet connection.'
    );
  });

  it('should use backend message for 400 and 409', () => {
    expect(getFriendlyError({ status: 400, error: { message: 'Bad input' } }, 'register')).toBe('Bad input');
    expect(getFriendlyError({ status: 409, error: { error: 'Already exists' } }, 'register')).toBe('Already exists');
  });

  it('should map common HTTP statuses', () => {
    expect(getFriendlyError({ status: 403 })).toBe('You don\'t have permission to do this.');
    expect(getFriendlyError({ status: 422, error: {} })).toBe('The information provided is invalid. Please check and try again.');
    expect(getFriendlyError({ status: 429 })).toBe('Too many attempts. Please wait a moment and try again.');
    expect(getFriendlyError({ status: 500 })).toBe('Something went wrong on our end. Please try again shortly.');
    expect(getFriendlyError({ status: 502 })).toBe('Something went wrong on our end. Please try again shortly.');
    expect(getFriendlyError({ status: 503 })).toBe('Something went wrong on our end. Please try again shortly.');
  });

  it('should apply login/register contextual fallbacks', () => {
    expect(getFriendlyError({ status: 401 }, 'login')).toBe('Invalid email or password.');
    expect(getFriendlyError({ status: 404 }, 'login')).toBe('Invalid email or password.');
    expect(getFriendlyError({ status: 400 }, 'login')).toBe('Something went wrong. Please try again.');
    expect(getFriendlyError({ status: 409 }, 'register')).toBe('An account with this email already exists.');
    expect(getFriendlyError({ status: 400 }, 'register')).toBe('Something went wrong. Please try again.');
  });

  it('should apply apply_job context fallbacks', () => {
    expect(getFriendlyError({ status: 409 }, 'apply_job')).toBe('You have already applied for this job.');
    expect(getFriendlyError({ status: 404 }, 'apply_job')).toBe('This job no longer exists.');
    expect(getFriendlyError({ status: 401 }, 'apply_job')).toBe('Please sign in to apply for this job.');
    expect(getFriendlyError({ status: 418 }, 'apply_job')).toBe('Failed to submit your application. Please try again.');
  });

  it('should apply other context fallbacks', () => {
    expect(getFriendlyError({ status: 401 }, 'post_job')).toBe('You must be logged in as a recruiter to post jobs.');
    expect(getFriendlyError({ status: 403 }, 'post_job')).toBe('You don\'t have permission to do this.');
    expect(getFriendlyError({ status: 400 }, 'post_job')).toBe('Failed to post the job. Please check your details and try again.');
    expect(getFriendlyError({ status: 400 }, 'update_profile')).toBe('Failed to update your profile. Please try again.');
    expect(getFriendlyError({ status: 400 }, 'upload_image')).toBe('Image upload failed. Please use a JPG or PNG under 5MB.');
    expect(getFriendlyError({ status: 400 }, 'load_jobs')).toBe('Failed to load jobs. Please refresh the page.');
    expect(getFriendlyError({ status: 400 }, 'load_applications')).toBe('Failed to load applications. Please refresh the page.');
    expect(getFriendlyError({ status: 400 }, 'load_users')).toBe('Failed to load users. Please refresh the page.');
    expect(getFriendlyError({ status: 400 }, 'delete_user')).toBe('Failed to delete user. Please try again.');
    expect(getFriendlyError({ status: 400 }, 'delete_job')).toBe('Failed to delete job. Please try again.');
    expect(getFriendlyError({ status: 400 }, 'update_status')).toBe('Failed to update status. Please try again.');
    expect(getFriendlyError({ status: 400 }, 'load_profile')).toBe('Failed to load profile. Please refresh the page.');
  });

  it('should handle non-http string messages safely', () => {
    expect(getFriendlyError('Custom short error')).toBe('Custom short error');
    expect(getFriendlyError('Http failure response for /api/xyz: 500')).toBe('Something went wrong. Please try again.');
    expect(getFriendlyError('Error from localhost dev proxy')).toBe('Something went wrong. Please try again.');
  });

  it('should handle HttpErrorResponse instance and generic defaults', () => {
    const err = new HttpErrorResponse({ status: 401 });
    expect(getFriendlyError(err)).toBe('Your session has expired. Please sign in again.');
    expect(getFriendlyError({ status: 404 })).toBe('The requested item could not be found.');
    expect(getFriendlyError({ status: 999 })).toBe('Something went wrong. Please try again.');
    expect(getFriendlyError({ message: 'x'.repeat(200) })).toBe('Something went wrong. Please try again.');
  });
});
