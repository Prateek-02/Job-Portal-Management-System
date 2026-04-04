import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // ── Auth routes (no navbar) ──────────────────────────────────
  {
    path: 'auth',
    loadComponent: () => import('./layout/auth-layout/auth-layout.component')
      .then(m => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
      }
    ]
  },

  // ── Main routes (with navbar) ────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component')
      .then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadChildren: () => import('./features/home/home.routes').then(m => m.HOME_ROUTES)
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
        canActivate: [authGuard]
      },
      {
        path: 'jobs',
        loadChildren: () => import('./features/jobs/jobs.routes').then(m => m.JOBS_ROUTES)
      },
      {
        path: 'applications',
        loadChildren: () => import('./features/applications/applications.routes')
          .then(m => m.APPLICATIONS_ROUTES),
        canActivate: [authGuard]
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes')
          .then(m => m.PROFILE_ROUTES),
        canActivate: [authGuard]
      },
      {
        path: 'notifications',
        loadChildren: () => import('./features/notifications/notifications.routes')
          .then(m => m.NOTIFICATIONS_ROUTES),
        canActivate: [authGuard]
      }
    ]
  },

  // ── Admin routes (with sidebar) ──────────────────────────────
  {
    path: 'admin',
    loadComponent: () => import('./layout/admin-layout/admin-layout.component')
      .then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ADMIN' },
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },

  // ── Fallback ─────────────────────────────────────────────────
  { path: '**', redirectTo: '/jobs' }
];