import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  { 
    path: '', 
    redirectTo: 'dashboard', 
    pathMatch: 'full' 
  }
];
