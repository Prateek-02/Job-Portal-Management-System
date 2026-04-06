import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';


@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent implements OnInit {

  constructor(
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: any) => {
      this.updateSphereColor();
    });
  }

  private updateSphereColor(): void {
    let color = 'var(--color-energy-indigo)';
    if (this.authService.isJobSeeker()) {
      color = 'var(--color-energy-violet)';
    } else if (this.authService.isRecruiter()) {
      color = 'var(--color-energy-emerald)';
    }
    document.documentElement.style.setProperty('--energy-sphere-color', color);
  }
}
