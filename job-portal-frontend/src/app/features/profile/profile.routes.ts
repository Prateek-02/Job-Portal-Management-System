import { Routes } from '@angular/router';
import { canDeactivateGuard } from '../../core/guards/can-deactivate.guard';

export const PROFILE_ROUTES: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
    canDeactivate: [canDeactivateGuard]
  }
];
