import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>Crear cuenta</h1>

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
            <div class="form-row">
              <div class="form-group">
                <label for="nombre">Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  [(ngModel)]="formData.nombre"
                  name="nombre"
                  required
                >
              </div>

              <div class="form-group">
                <label for="apellidos">Apellidos</label>
                <input
                  type="text"
                  id="apellidos"
                  [(ngModel)]="formData.apellidos"
                  name="apellidos"
                >
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="formData.email"
                name="email"
                required
              >
            </div>

            <div class="form-group">
              <label for="telefono">Telefono</label>
              <input
                type="tel"
                id="telefono"
                [(ngModel)]="formData.telefono"
                name="telefono"
              >
            </div>

            <div class="form-group">
              <label for="dni">DNI/NIE</label>
              <input
                type="text"
                id="dni"
                [(ngModel)]="formData.dni"
                name="dni"
              >
            </div>

            <div class="form-group">
              <label for="password">Contraseña *</label>
              <input
                type="password"
                id="password"
                [(ngModel)]="formData.password"
                name="password"
                required
                minlength="8"
              >
              <small>Minimo 8 caracteres</small>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmar contraseña *</label>
              <input
                type="password"
                id="confirmPassword"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                required
              >
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="loading()">
              {{ loading() ? 'Creando cuenta...' : 'Crear cuenta' }}
            </button>
          </form>

          <div class="auth-links">
            <span>¿Ya tienes cuenta?</span>
            <a routerLink="/login">Iniciar sesion</a>
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
      max-width: 500px;
    }

    h1 {
      text-align: center;
      margin-bottom: 2rem;
      color: #333;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
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

    input:focus {
      outline: none;
      border-color: #667eea;
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
      text-align: center;
      text-decoration: none;
      display: block;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #5a6fd6;
    }

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
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
      padding: 2rem;
    }

    .success-message p {
      color: #080;
      margin-bottom: 1.5rem;
    }

    .auth-links {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
    }

    .auth-links a {
      color: #667eea;
      text-decoration: none;
      margin-left: 0.5rem;
    }

    .auth-links a:hover {
      text-decoration: underline;
    }

    @media (max-width: 500px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RegistroComponent {
  private authService = inject(AuthService);

  formData = {
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    dni: '',
    password: ''
  };
  confirmPassword = '';

  loading = signal(false);
  error = signal('');
  success = signal('');

  onSubmit() {
    this.error.set('');

    if (!this.formData.nombre || !this.formData.email || !this.formData.password) {
      this.error.set('Por favor, completa los campos obligatorios');
      return;
    }

    if (this.formData.password.length < 8) {
      this.error.set('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (this.formData.password !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.loading.set(true);

    this.authService.register(this.formData).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.success.set(response.message || 'Cuenta creada correctamente. Revisa tu email para verificar tu cuenta.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Error al crear la cuenta');
      }
    });
  }
}
