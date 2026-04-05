import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { getFriendlyError } from '../../../../core/utils/error-handler.util';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  token: string | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.errorMessage = 'Invalid or missing reset token.';
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.resetForm.valid && this.token) {
      this.isLoading = true;
      this.errorMessage = '';
      const newPassword = this.resetForm.value.password;

      // Note: Standalone reset is legacy. Redirecting to OTP flow in ForgotPassword is the new standard.
      // Satisfaction of compiler signature with empty email and token as OTP.
      this.apiService.resetPassword('', this.token || '', newPassword).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.successMessage = res.message || 'Password successfully reset!';
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = getFriendlyError(err);
        }
      });
    }
  }
}
