import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const APPLICATIONS_ROUTES: Routes = [
  {
    path: 'my-applications',
    loadComponent: () => import('./components/my-applications/my-applications.component')
      .then(m => m.MyApplicationsComponent),
    canActivate: [roleGuard],
    data: { role: 'JOB_SEEKER' }
  },
  {
    path: 'job/:jobId',
    loadComponent: () => import('./components/manage-applications/manage-applications.component')
      .then(m => m.ManageApplicationsComponent),
    canActivate: [roleGuard],
    data: { role: 'RECRUITER' }
  },
  {
    path: 'recruiter',
    loadComponent: () => import('./components/all-applications/all-applications.component')
      .then(m => m.AllApplicationsComponent),
    canActivate: [roleGuard],
    data: { role: 'RECRUITER' }
  },
  {
    path: '',
    redirectTo: 'my-applications',
    pathMatch: 'full'
  }
];
