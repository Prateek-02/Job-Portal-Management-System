import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.css']
})
export class JobDetailComponent implements OnInit {
  job: any = null;
  isLoading = true;
  errorMessage = '';

  // Application Modal state
  showApplyModal = false;
  applyForm: FormGroup;
  isApplying = false;
  applyError = '';
  applySuccess = false;
  selectedFile: File | null = null;
  
  isApplicant = false;
  isRecruiter = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    public authService: AuthService,
    private fb: FormBuilder
  ) {
    this.applyForm = this.fb.group({
      resume: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    const userRole = this.authService.getCurrentUser()?.role;
    this.isApplicant = userRole === 'APPLICANT';
    this.isRecruiter = userRole === 'RECRUITER';

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadJobDetails(id);
      }
    });
  }

  loadJobDetails(id: string): void {
    this.isLoading = true;
    this.apiService.getJobById(id).subscribe({
      next: (data) => {
        this.job = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load job details. It may have been removed.';
        this.isLoading = false;
      }
    });
  }

  openApplyModal(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.showApplyModal = true;
    this.applySuccess = false;
    this.applyError = '';
    this.selectedFile = null;
    this.applyForm.reset();
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
  }

  onFileChange(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      this.applyForm.patchValue({ resume: this.selectedFile });
      this.applyForm.get('resume')?.updateValueAndValidity();
    }
  }

  submitApplication(): void {
    if (!this.selectedFile || !this.job?.id) return;

    this.isApplying = true;
    this.applyError = '';

    this.apiService.applyForJob(this.job.id, this.selectedFile).subscribe({
      next: (res) => {
        this.isApplying = false;
        this.applySuccess = true;
        setTimeout(() => this.closeApplyModal(), 2000);
      },
      error: (err) => {
        this.isApplying = false;
        this.applyError = err.message || 'Failed to submit application.';
      }
    });
  }
}
