import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css']
})
export class JobListComponent implements OnInit {
  jobs: any[] = [];
  filterForm: FormGroup;
  isLoading = true;
  errorMessage = '';
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      title: [''],
      location: [''],
      companyName: ['']
    });
  }

  ngOnInit(): void {
    this.loadJobs();

    // Auto-search when basic text filters change
    this.filterForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 0;
        this.loadJobs();
      });
  }

  loadJobs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Determine if we need to use search API or standard GET API
    const filters = this.filterForm.value;
    const hasFilters = Object.values(filters).some(val => val !== null && val !== '');

    if (hasFilters) {
      this.apiService.searchJobs(filters, this.currentPage, this.pageSize)
        .subscribe({
          next: (res: any) => this.processPageResponse(res),
          error: (err: any) => this.handleError(err)
        });
    } else {
      this.apiService.getJobs(this.currentPage, this.pageSize)
        .subscribe({
          next: (res: any) => this.processPageResponse(res),
          error: (err: any) => this.handleError(err)
        });
    }
  }

  private processPageResponse(res: any): void {
    this.jobs = res.content || [];
    this.totalPages = res.totalPages || 0;
    this.totalElements = res.totalElements || 0;
    this.isLoading = false;
  }

  private handleError(err: any): void {
    this.errorMessage = 'Failed to load jobs. Please try again later.';
    this.isLoading = false;
    console.error(err);
  }

  onPageChange(pageIndex: number): void {
    if (pageIndex >= 0 && pageIndex < this.totalPages) {
      this.currentPage = pageIndex;
      this.loadJobs();
    }
  }

  clearFilters(): void {
    this.filterForm.reset();
  }
}
