import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>Recuperar contraseña</h1>

        @if (success()) {
          <div class="success-message">
            <p>{{ success() }}</p>
            <a routerLink="/login" class="btn btn-outline">Volver a login</a>
          </div>
        } @else {
          <p class="description">Introduce tu email y te enviaremos las instrucciones para restablecer tu contraseña.</p>

          @if (error()) {
            <div class="error-message">{{ error() }}</div>
          }

          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                required
              >
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="loading()">
              {{ loading() ? 'Enviando...' : 'Enviar instrucciones' }}
            </button>
          </form>

          <div class="auth-links">
            <a routerLink="/login">Volver a iniciar sesion</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: calc(100vh - 120px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: #f5f5f5;
    }

    .auth-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
    }

    h1 {
      text-align: center;
      margin-bottom: 1rem;
    }

    .description {
      text-align: center;
      color: #666;
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .btn {
      width: 100%;
      padding: 0.75rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      margin-top: 1rem;
      text-decoration: none;
      display: block;
      text-align: center;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-outline {
      background: white;
      border: 1px solid #667eea;
      color: #667eea;
    }

    .error-message {
      background: #fee;
      color: #c00;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      text-align: center;
    }

    .success-message {
      text-align: center;
    }

    .success-message p {
      color: #080;
      margin-bottom: 1.5rem;
    }

    .auth-links {
      text-align: center;
      margin-top: 1.5rem;
    }

    .auth-links a {
      color: #667eea;
      text-decoration: none;
    }
  `]
})
export class RecuperarPasswordComponent {
  private authService = inject(AuthService);

  email = '';
  loading = signal(false);
  error = signal('');
  success = signal('');

  onSubmit() {
    if (!this.email) {
      this.error.set('Introduce tu email');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.success.set(response.message);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message);
      }
    });
  }
}
