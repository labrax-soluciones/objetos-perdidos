import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>Nueva contraseña</h1>

        @if (success()) {
          <div class="success-message">
            <p>{{ success() }}</p>
            <a routerLink="/login" class="btn btn-primary">Ir a iniciar sesion</a>
          </div>
        } @else {
          @if (error()) {
            <div class="error-message">{{ error() }}</div>
          }

          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="password">Nueva contraseña</label>
              <input
                type="password"
                id="password"
                [(ngModel)]="password"
                name="password"
                required
                minlength="8"
              >
              <small>Minimo 8 caracteres</small>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmar contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                required
              >
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="loading()">
              {{ loading() ? 'Guardando...' : 'Guardar nueva contraseña' }}
            </button>
          </form>
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
      margin-bottom: 2rem;
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

    small {
      color: #666;
      font-size: 0.75rem;
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
  `]
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  token = '';
  password = '';
  confirmPassword = '';
  loading = signal(false);
  error = signal('');
  success = signal('');

  ngOnInit() {
    this.token = this.route.snapshot.params['token'];
  }

  onSubmit() {
    this.error.set('');

    if (this.password.length < 8) {
      this.error.set('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.loading.set(true);

    this.authService.resetPassword(this.token, this.password).subscribe({
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
