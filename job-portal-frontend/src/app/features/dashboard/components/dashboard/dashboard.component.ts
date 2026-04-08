import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { JobSeekerViewComponent } from './job-seeker-view/job-seeker-view.component';
import { RecruiterViewComponent } from './recruiter-view/recruiter-view.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, JobSeekerViewComponent, RecruiterViewComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: any = null;
  isRecruiter = false;
  isJobSeeker = false;
  private subs = new Subscription();

  constructor(
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.subs.add(
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.user = user;
          this.isRecruiter = this.authService.isRecruiter();
          this.isJobSeeker = this.authService.isJobSeeker();

          if (this.authService.isAdmin()) {
            this.router.navigate(['/admin/dashboard']);
          }
        } else if (this.authService.isAdmin()) {
          this.router.navigate(['/admin/dashboard']);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
