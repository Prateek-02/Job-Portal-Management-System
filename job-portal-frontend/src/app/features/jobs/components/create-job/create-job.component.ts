import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { JobRequest } from '../../../../models/job.model';

@Component({
  selector: 'app-create-job',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-job.component.html'
})
export class CreateJobComponent {
  jobForm: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.jobForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      companyName: ['', Validators.required],
      location: ['', Validators.required],
      salary: [null, [Validators.required, Validators.min(0)]],
      experience: [null, [Validators.required, Validators.min(0)]],
      description: ['', [Validators.required, Validators.minLength(30)]]
    });
  }

  onSubmit(): void {
    if (this.jobForm.invalid) { this.jobForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    this.errorMessage = '';

    const payload: JobRequest = this.jobForm.value;
    this.apiService.createJob(payload).subscribe({
      next: (job) => {
        this.isSubmitting = false;
        this.successMessage = 'Job posted successfully! Redirecting...';
        setTimeout(() => this.router.navigate(['/jobs', job.id]), 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.message || 'Failed to post job. Please try again.';
      }
    });
  }
}
