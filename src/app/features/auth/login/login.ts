import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  username = '';
  password = '';

  isLoading = signal(false);
  errorMessage = signal('');

  login(): void {
    if (!this.username || !this.password) {
      this.errorMessage.set(
        'Username and password are required.',
      );

      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.auth
      .login({
        username: this.username,
        password: this.password,
      })
      .subscribe({
        next: (response) => {
          console.log('Login successful:', response);

          this.isLoading.set(false);

          this.router.navigate(['/matches']);
        },

        error: (error) => {
          console.error('Login failed:', error);

          this.isLoading.set(false);

          this.errorMessage.set(
            error.error?.message ??
            'Login failed. Please try again.',
          );
        },
      });
  }

  fillDemo(type: 'user' | 'admin'): void {
    if (type === 'user') {
      this.username = 'user';
      this.password = 'password123';
    } else {
      this.username = 'admin';
      this.password = 'admin123';
    }
    this.login();
  }
}