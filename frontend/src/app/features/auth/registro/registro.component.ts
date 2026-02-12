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
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InputTextModule, ButtonModule, ToastModule, PasswordModule, FloatLabelModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="min-h-[calc(100vh-120px)] flex items-center justify-center p-8 bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h1 class="text-center mb-8 text-gray-800 text-2xl font-bold">Crear cuenta</h1>

        @if (success()) {
          <div class="text-center p-8">
            <p class="text-green-600 mb-6">{{ success() }}</p>
            <a routerLink="/login" class="block w-full p-3 bg-primary text-white rounded font-medium text-center hover:bg-primary-dark">Ir a iniciar sesion</a>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="mb-4">
                <p-floatlabel>
                  <input
                    pInputText
                    id="nombre"
                    [(ngModel)]="formData.nombre"
                    name="nombre"
                    class="w-full"
                  />
                  <label for="nombre">Nombre *</label>
                </p-floatlabel>
              </div>

              <div class="mb-4">
                <p-floatlabel>
                  <input
                    pInputText
                    id="apellidos"
                    [(ngModel)]="formData.apellidos"
                    name="apellidos"
                    class="w-full"
                  />
                  <label for="apellidos">Apellidos</label>
                </p-floatlabel>
              </div>
            </div>

            <div class="mb-4">
              <p-floatlabel>
                <input
                  pInputText
                  id="email"
                  [(ngModel)]="formData.email"
                  name="email"
                  class="w-full"
                />
                <label for="email">Email *</label>
              </p-floatlabel>
            </div>

            <div class="mb-4">
              <p-floatlabel>
                <input
                  pInputText
                  id="telefono"
                  [(ngModel)]="formData.telefono"
                  name="telefono"
                  class="w-full"
                />
                <label for="telefono">Telefono</label>
              </p-floatlabel>
            </div>

            <div class="mb-4">
              <p-floatlabel>
                <input
                  pInputText
                  id="dni"
                  [(ngModel)]="formData.dni"
                  name="dni"
                  class="w-full"
                />
                <label for="dni">DNI/NIE</label>
              </p-floatlabel>
            </div>

            <div class="mb-4">
              <p-floatlabel>
                <p-password
                  id="password"
                  [(ngModel)]="formData.password"
                  name="password"
                  [toggleMask]="true"
                  [feedback]="true"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                />
                <label for="password">Contrasena *</label>
              </p-floatlabel>
              <small class="text-gray-500 text-xs">Minimo 8 caracteres</small>
            </div>

            <div class="mb-4">
              <p-floatlabel>
                <p-password
                  id="confirmPassword"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  [toggleMask]="true"
                  [feedback]="false"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                />
                <label for="confirmPassword">Confirmar contrasena *</label>
              </p-floatlabel>
            </div>

            <p-button
              type="submit"
              [label]="loading() ? 'Creando cuenta...' : 'Crear cuenta'"
              [disabled]="loading()"
              styleClass="w-full mt-4"
            />
          </form>

          <div class="text-center mt-6 text-sm">
            <span class="text-gray-600">¿Ya tienes cuenta?</span>
            <a routerLink="/login" class="text-primary hover:underline ml-2">Iniciar sesion</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class RegistroComponent {
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

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
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, completa los campos obligatorios' });
      return;
    }

    if (this.formData.password.length < 8) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'La contraseña debe tener al menos 8 caracteres' });
      return;
    }

    if (this.formData.password !== this.confirmPassword) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Las contraseñas no coinciden' });
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
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message || 'Error al crear la cuenta' });
      }
    });
  }
}
