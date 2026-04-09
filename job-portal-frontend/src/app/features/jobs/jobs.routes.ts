import { Routes } from '@angular/router';
import { JobListComponent } from './components/job-list/job-list.component';
import { JobDetailComponent } from './components/job-detail/job-detail.component';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';
import { canDeactivateGuard } from '../../core/guards/can-deactivate.guard';

export const JOBS_ROUTES: Routes = [
  { path: '', component: JobListComponent },
  {
    path: 'create/new',
    loadComponent: () => import('./components/create-job/create-job.component').then(m => m.CreateJobComponent),
    canActivate: [authGuard, roleGuard],
    canDeactivate: [canDeactivateGuard],
    data: { role: 'RECRUITER' }
  },

  {
    path: 'my-postings',
    loadComponent: () => import('./components/my-jobs/my-jobs.component').then(m => m.MyJobsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'RECRUITER' }
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./components/create-job/create-job.component').then(m => m.CreateJobComponent),
    canActivate: [authGuard, roleGuard],
    canDeactivate: [canDeactivateGuard],
    data: { role: 'RECRUITER' }
  },
  { path: ':id', component: JobDetailComponent }
];
