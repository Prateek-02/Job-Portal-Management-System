import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component')
      .then(m => m.AdminDashboardComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./components/user-management/user-management.component')
      .then(m => m.UserManagementComponent)
  },
  {
    path: 'jobs',
    loadComponent: () => import('./components/job-management/job-management.component')
      .then(m => m.JobManagementComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
