import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verificar-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-120px)] flex items-center justify-center p-8 bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        @if (loading()) {
          <div class="py-8 text-gray-600">Verificando email...</div>
        } @else if (success()) {
          <div>
            <h1 class="text-2xl font-bold mb-4">Email verificado</h1>
            <p class="text-green-600 mb-6">{{ success() }}</p>
            <a routerLink="/login" class="inline-block px-6 py-3 bg-primary text-white rounded font-medium hover:bg-primary-dark">Iniciar sesion</a>
          </div>
        } @else {
          <div>
            <h1 class="text-2xl font-bold mb-4">Error de verificacion</h1>
            <p class="text-red-600 mb-6">{{ error() }}</p>
            <a routerLink="/" class="inline-block px-6 py-3 bg-white border border-primary text-primary rounded font-medium hover:bg-primary hover:text-white transition-colors">Volver al inicio</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
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
