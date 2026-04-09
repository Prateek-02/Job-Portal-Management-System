import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html'
})
export class PaginationComponent implements OnChanges {
  @Input() currentPage = 0;
  @Input() totalPages = 0;
  @Input() totalElements = 0;
  @Input() pageSize = 10;

  @Output() pageChange = new EventEmitter<number>();

  visiblePages: number[] = [];

  ngOnChanges(): void {
    this.buildVisiblePages();
  }

  private buildVisiblePages(): void {
    if (this.totalPages <= 0) { this.visiblePages = []; return; }

    const maxVisible = 5;
    let start = Math.max(0, this.currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(this.totalPages, start + maxVisible);
    start = Math.max(0, end - maxVisible); // Adjust start if we're near the end

    this.visiblePages = Array.from({ length: end - start }, (_, i) => start + i);
  }

  goTo(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  get startItem(): number {
    return this.totalElements === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }
}
