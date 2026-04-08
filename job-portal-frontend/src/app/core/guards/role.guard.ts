import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from '../services/storage.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const storageService = inject(StorageService);
  const router = inject(Router);

  const requiredRole = route.data?.['role'] as string;
  const userRole = storageService.getUserRole();

  if (!requiredRole || userRole === requiredRole) {
    return true;
  }


  router.navigate(['/404']);
  return false;
};
