import { Routes } from '@angular/router';
import { JobListComponent } from './components/job-list/job-list.component';
import { JobDetailComponent } from './components/job-detail/job-detail.component';

export const JOBS_ROUTES: Routes = [
  { path: '', component: JobListComponent },
  { 
    path: 'create/new', 
    loadComponent: () => import('./components/create-job/create-job.component').then(m => m.CreateJobComponent),
    data: { role: 'RECRUITER' }
  },
  { path: ':id', component: JobDetailComponent }
];
