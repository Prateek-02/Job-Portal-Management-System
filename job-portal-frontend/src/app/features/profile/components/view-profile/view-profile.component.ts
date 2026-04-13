import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-profile.component.html'
})
export class ViewProfileComponent {
  @Input() user: User | null = null;

  getSkillsList(): string[] {
    return this.user?.skills 
      ? this.user.skills.split(',').map((s: string) => s.trim()).filter(Boolean) 
      : [];
  }

  hasBio(): boolean {
    return !!this.user?.bio;
  }

  getDisplayName(): string {
    return this.user?.name || 'N/A';
  }

  getDisplayPhone(): string {
    return this.user?.phone || 'N/A';
  }
}
