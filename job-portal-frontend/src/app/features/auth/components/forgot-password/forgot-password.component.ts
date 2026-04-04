import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { getFriendlyError } from '../../../../core/utils/error-handler.util';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styleUrls: [],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  resetForm: FormGroup;
  
  showOtpStep = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private fb: FormBuilder, private apiService: ApiService, private router: Router) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSendOtp() {
    if (this.forgotForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      const email = this.forgotForm.value.email;

      this.apiService.forgotPassword(email).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.successMessage = 'OTP sent to your email!';
          this.showOtpStep = true;
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = getFriendlyError(err);
        }
      });
    }
  }

  onResetPassword() {
    if (this.resetForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const email = this.forgotForm.value.email;
      const { otp, newPassword } = this.resetForm.value;

      this.apiService.resetPassword(email, otp, newPassword).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.successMessage = res.message || 'Password reset successfully!';
          // Success state - navigate to login after a delay
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = getFriendlyError(err);
        }
      });
    }
  }
}
