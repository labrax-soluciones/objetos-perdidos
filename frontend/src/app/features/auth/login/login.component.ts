import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InputTextModule, ButtonModule, ToastModule, PasswordModule, FloatLabelModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="min-h-[calc(100vh-120px)] flex items-center justify-center p-8 bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 class="text-center mb-8 text-gray-800 text-2xl font-bold">Iniciar sesion</h1>

        <form (ngSubmit)="onSubmit()">
          <div class="mb-4">
            <p-floatlabel>
              <input
                pInputText
                id="email"
                [(ngModel)]="email"
                name="email"
                autocomplete="email"
                class="w-full"
              />
              <label for="email">Email</label>
            </p-floatlabel>
          </div>

          <div class="mb-4">
            <p-floatlabel>
              <p-password
                id="password"
                [(ngModel)]="password"
                name="password"
                [toggleMask]="true"
                [feedback]="false"
                autocomplete="current-password"
                styleClass="w-full"
                inputStyleClass="w-full"
              />
              <label for="password">Contrasena</label>
            </p-floatlabel>
          </div>

          <p-button
            type="submit"
            [label]="loading() ? 'Cargando...' : 'Iniciar sesion'"
            [disabled]="loading()"
            styleClass="w-full mt-4"
          />
        </form>

        <div class="text-center mt-6 text-sm">
          <a routerLink="/recuperar-password" class="text-primary hover:underline">¿Olvidaste tu contraseña?</a>
          <span class="mx-2 text-gray-400">|</span>
          <a routerLink="/registro" class="text-primary hover:underline">Crear cuenta</a>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  onSubmit() {
    if (!this.email || !this.password) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, completa todos los campos' });
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message || 'Error al iniciar sesion' });
      }
    });
  }
}
