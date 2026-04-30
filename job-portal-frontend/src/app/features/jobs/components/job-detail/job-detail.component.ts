import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Job } from '../../../../models/job.model';
import { getFriendlyError } from '../../../../core/utils/error-handler.util';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './job-detail.component.html'
})
export class JobDetailComponent implements OnInit, OnDestroy {
  job: Job | null = null;
  isLoading = true;
  errorMessage = '';
  hasApplied = false;

  // Apply modal
  showApplyModal = false;
  applyForm!: FormGroup;
  selectedFile: File | null = null;
  isApplying = false;
  applyError = '';
  applySuccess = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    public authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.applyForm = this.fb.group({ resume: [null, Validators.required] });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadJob(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadJob(id: number): void {
    this.isLoading = true;
    this.apiService.getJobById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (job) => {
        this.job = job;
        this.isLoading = false;
        if (this.authService.isJobSeeker()) {
          this.checkApplicationStatus(job.id);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = getFriendlyError(err, 'load_jobs');
        this.isLoading = false;
        this.cdr.detectChanges();
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

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.applyForm.patchValue({ resume: this.selectedFile });
    }
  }

  submitApplication(): void {
    if (!this.selectedFile || !this.job?.id) return;
    this.isApplying = true;
    this.applyError = '';

    this.apiService.applyForJob(this.job.id, this.selectedFile).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isApplying = false;
        this.applySuccess = true;
        this.hasApplied = true;
        setTimeout(() => { this.showApplyModal = false; }, 2500);
      },
      error: (err) => {
        this.isApplying = false;
        this.applyError = getFriendlyError(err, 'apply_job');
      }
    });
  }

  checkApplicationStatus(jobId: number): void {
    this.apiService.checkHasApplied(jobId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (applied) => {
        this.hasApplied = applied;
        this.cdr.detectChanges();
      },
      error: () => {
        // Silently fail, default to false
      }
    });
  }

  filterBySkill(skill: string): void {
    this.router.navigate(['/jobs'], { queryParams: { skill: skill } });
  }
}
