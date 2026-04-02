import { Routes } from '@angular/router';

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/notifications/notifications.component')
      .then(m => m.NotificationsComponent)
  }
];
