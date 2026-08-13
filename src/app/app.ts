import { Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from './core/services/auth';
import { ThemeService } from './core/services/theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  readonly themeService = inject(ThemeService);

  readonly isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');

  ngOnInit(): void {
    if (!this.auth.currentUser()) {
      this.auth.getCurrentUser().subscribe();
    }
  }

  cycleTheme(): void {
    this.themeService.cycleTheme();
  }

  isLoginPage(): boolean {
    return this.router.url.includes('/login');
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}

