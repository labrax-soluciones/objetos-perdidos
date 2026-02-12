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
    <div class="min-h-[calc(100vh-120px)] flex items-center justify-center p-8 bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 class="text-center mb-4 text-gray-800 text-2xl font-bold">Recuperar contraseña</h1>

        @if (success()) {
          <div class="text-center">
            <p class="text-green-600 mb-6">{{ success() }}</p>
            <a routerLink="/login" class="block w-full p-3 bg-white border border-primary text-primary rounded font-medium text-center hover:bg-primary hover:text-white transition-colors">Volver a login</a>
          </div>
        } @else {
          <p class="text-center text-gray-600 mb-6">Introduce tu email y te enviaremos las instrucciones para restablecer tu contraseña.</p>

          @if (error()) {
            <div class="bg-red-50 text-red-600 p-3 rounded mb-4 text-center">{{ error() }}</div>
          }

          <form (ngSubmit)="onSubmit()">
            <div class="mb-4">
              <label for="email" class="block mb-2 font-medium">Email</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                required
                class="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-primary"
              >
            </div>

            <button type="submit" class="w-full p-3 mt-4 bg-primary text-white rounded font-medium hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed" [disabled]="loading()">
              {{ loading() ? 'Enviando...' : 'Enviar instrucciones' }}
            </button>
          </form>

          <div class="text-center mt-6">
            <a routerLink="/login" class="text-primary hover:underline">Volver a iniciar sesion</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
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
