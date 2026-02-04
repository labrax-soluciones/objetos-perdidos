import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verificar-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        @if (loading()) {
          <div class="loading">Verificando email...</div>
        } @else if (success()) {
          <div class="success-message">
            <h1>Email verificado</h1>
            <p>{{ success() }}</p>
            <a routerLink="/login" class="btn btn-primary">Iniciar sesion</a>
          </div>
        } @else {
          <div class="error-container">
            <h1>Error de verificacion</h1>
            <p class="error">{{ error() }}</p>
            <a routerLink="/" class="btn btn-outline">Volver al inicio</a>
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
      text-align: center;
    }

    h1 {
      margin-bottom: 1rem;
    }

    .loading {
      padding: 2rem;
      color: #666;
    }

    .success-message p {
      color: #080;
      margin-bottom: 1.5rem;
    }

    .error-container .error {
      color: #c00;
      margin-bottom: 1.5rem;
    }

    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
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
  `]
})
export class VerificarEmailComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  success = signal('');
  error = signal('');

  ngOnInit() {
    const token = this.route.snapshot.params['token'];
    this.verificar(token);
  }

  private verificar(token: string) {
    this.authService.verifyEmail(token).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.success.set(response.message);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Token invalido o expirado');
      }
    });
  }
}
