import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CanComponentDeactivate } from '../../../../core/guards/can-deactivate.guard';
import { ApiService } from '../../../../core/services/api.service';
import { Job, JobRequest } from '../../../../models/job.model';
import { getFriendlyError } from '../../../../core/utils/error-handler.util';
import { Editor, Toolbar, NgxEditorModule } from 'ngx-editor';

@Component({
  selector: 'app-create-job',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgxEditorModule],
  templateUrl: './create-job.component.html'
})
export class CreateJobComponent implements OnInit, OnDestroy, CanComponentDeactivate {
  jobForm: FormGroup;
  isSubmitting = false;
  isEditMode = false;
  jobId?: number;
  successMessage = '';
  errorMessage = '';
  jobTypes = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];

  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['bullet_list', 'ordered_list']
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.jobForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      companyName: ['', Validators.required],
      location: ['', Validators.required],
      salary: [null, [Validators.required, Validators.min(0)]],
      experience: [null, [Validators.required, Validators.min(0)]],
      jobType: ['Full-time', Validators.required],
      description: ['', [Validators.required, Validators.minLength(30)]],
      skills: ['']
    });
  }

  ngOnInit(): void {
    this.editor = new Editor();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.jobId = +id;
      this.loadJobDetails();
    }
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  canDeactivate(): boolean {
    if (this.jobForm.dirty && !this.isSubmitting) {
      return confirm('You have unsaved changes! Are you sure you want to discard them and leave this page?');
    }
    return true;
  }

  loadJobDetails(): void {
    if (!this.jobId) return;
    this.apiService.getJobById(this.jobId).subscribe({
      next: (job) => {
        this.jobForm.patchValue({
          title: job.title,
          companyName: job.companyName,
          location: job.location,
          salary: job.salary,
          experience: job.experience,
          jobType: job.jobType,
          description: job.description,
          skills: job.skills?.join(', ') || ''
        });
      },
      error: (err) => {
        this.errorMessage = 'Failed to load job details. Please try again.';
      }
    });
  }

  onSubmit(): void {
    if (this.jobForm.invalid) { this.jobForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    this.errorMessage = '';

    const formValue = this.jobForm.value;
    const skills = formValue.skills 
      ? formValue.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '')
      : [];

    const payload: JobRequest = {
      ...formValue,
      skills
    };
    
    const request = this.isEditMode && this.jobId
      ? this.apiService.updateJob(this.jobId, payload)
      : this.apiService.createJob(payload);

    request.subscribe({
      next: (job) => {
        this.isSubmitting = false;
        this.jobForm.markAsPristine();
        this.successMessage = this.isEditMode 
          ? 'Job updated successfully! Redirecting...' 
          : 'Job posted successfully! Redirecting...';
        setTimeout(() => this.router.navigate(['/jobs', job.id]), 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = getFriendlyError(err, this.isEditMode ? 'update_job' : 'post_job');
      }
    });
  }
}
