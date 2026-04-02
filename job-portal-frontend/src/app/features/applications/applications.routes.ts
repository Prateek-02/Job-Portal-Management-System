import { Routes } from '@angular/router';

export const APPLICATIONS_ROUTES: Routes = [
  {
    path: 'my-applications',
    loadComponent: () => import('./components/my-applications/my-applications.component')
      .then(m => m.MyApplicationsComponent)
  },
  {
    path: 'job/:jobId',
    loadComponent: () => import('./components/manage-applications/manage-applications.component')
      .then(m => m.ManageApplicationsComponent)
  },
  {
    path: '',
    redirectTo: 'my-applications',
    pathMatch: 'full'
  }
];
