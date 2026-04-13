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
}
