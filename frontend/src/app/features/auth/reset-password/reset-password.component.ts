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
    <div class="min-h-[calc(100vh-120px)] flex items-center justify-center p-8 bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 class="text-center mb-8 text-gray-800 text-2xl font-bold">Nueva contraseña</h1>

        @if (success()) {
          <div class="text-center">
            <p class="text-green-600 mb-6">{{ success() }}</p>
            <a routerLink="/login" class="block w-full p-3 bg-primary text-white rounded font-medium text-center hover:bg-primary-dark">Ir a iniciar sesion</a>
          </div>
        } @else {
          @if (error()) {
            <div class="bg-red-50 text-red-600 p-3 rounded mb-4 text-center">{{ error() }}</div>
          }

          <form (ngSubmit)="onSubmit()">
            <div class="mb-4">
              <label for="password" class="block mb-2 font-medium">Nueva contraseña</label>
              <input
                type="password"
                id="password"
                [(ngModel)]="password"
                name="password"
                required
                minlength="8"
                class="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-primary"
              >
              <small class="text-gray-500 text-xs">Minimo 8 caracteres</small>
            </div>

            <div class="mb-4">
              <label for="confirmPassword" class="block mb-2 font-medium">Confirmar contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                required
                class="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-primary"
              >
            </div>

            <button type="submit" class="w-full p-3 mt-4 bg-primary text-white rounded font-medium hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed" [disabled]="loading()">
              {{ loading() ? 'Guardando...' : 'Guardar nueva contraseña' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: []
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
