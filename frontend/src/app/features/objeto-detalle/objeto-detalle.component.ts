import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ObjetoService } from '../../core/services/objeto.service';
import { AuthService } from '../../core/services/auth.service';
import { Objeto } from '../../core/models';
import { GalleriaModule } from 'primeng/galleria';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface GalleriaImage {
  url: string;
  thumbnailUrl: string;
  alt: string;
}

@Component({
  selector: 'app-objeto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, GalleriaModule, ButtonModule, TagModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="max-w-6xl mx-auto p-8">
      @if (loading()) {
        <div class="text-center py-12 text-gray-500">Cargando...</div>
      } @else if (error()) {
        <div class="text-center py-12 text-red-600">{{ error() }}</div>
      } @else if (objeto()) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div class="md:sticky md:top-8">
            @if (images().length > 0) {
              <p-galleria
                [value]="images()"
                [numVisible]="5"
                [thumbnailsPosition]="'bottom'"
                [showItemNavigators]="true"
                [showThumbnails]="images().length > 1"
                [circular]="true"
                [containerStyle]="{'max-width': '100%'}"
              >
                <ng-template pTemplate="item" let-item>
                  <img [src]="item.url" [alt]="item.alt" class="w-full rounded-lg" style="max-height: 400px; object-fit: contain;" />
                </ng-template>
                <ng-template pTemplate="thumbnail" let-item>
                  <img [src]="item.thumbnailUrl || item.url" [alt]="item.alt" class="w-20 h-20 object-cover rounded" />
                </ng-template>
              </p-galleria>
            } @else {
              <div class="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                Sin imagen
              </div>
            }
          </div>

          <div class="py-4">
            <p-tag [value]="objeto()!.codigoUnico" severity="secondary" class="mb-2" />
            <h1 class="text-3xl font-bold my-2">{{ objeto()!.titulo }}</h1>

            @if (objeto()!.categoria) {
              <p-tag [value]="objeto()!.categoria!.nombre" severity="info" />
            }

            <div class="mt-8">
              @if (objeto()!.descripcion) {
                <div class="mb-4 pb-4 border-b border-gray-200">
                  <strong class="block text-gray-500 mb-1">Descripcion:</strong>
                  <p class="m-0">{{ objeto()!.descripcion }}</p>
                </div>
              }

              @if (objeto()!.marca) {
                <div class="mb-4 pb-4 border-b border-gray-200">
                  <strong class="block text-gray-500 mb-1">Marca:</strong> {{ objeto()!.marca }}
                </div>
              }

              @if (objeto()!.modelo) {
                <div class="mb-4 pb-4 border-b border-gray-200">
                  <strong class="block text-gray-500 mb-1">Modelo:</strong> {{ objeto()!.modelo }}
                </div>
              }

              @if (objeto()!.color) {
                <div class="mb-4 pb-4 border-b border-gray-200">
                  <strong class="block text-gray-500 mb-1">Color:</strong> {{ objeto()!.color }}
                </div>
              }

              @if (objeto()!.fechaHallazgo) {
                <div class="mb-4 pb-4 border-b border-gray-200">
                  <strong class="block text-gray-500 mb-1">Fecha de hallazgo:</strong> {{ objeto()!.fechaHallazgo | date:'dd/MM/yyyy' }}
                </div>
              }

              @if (objeto()!.direccionHallazgo) {
                <div class="mb-4 pb-4 border-b border-gray-200">
                  <strong class="block text-gray-500 mb-1">Lugar de hallazgo:</strong> {{ objeto()!.direccionHallazgo }}
                </div>
              }

              @if (objeto()!.ayuntamiento) {
                <div class="mb-4 pb-4 border-b border-gray-200">
                  <strong class="block text-gray-500 mb-1">Ayuntamiento:</strong> {{ objeto()!.ayuntamiento!.nombre }}
                </div>
              }
            </div>

            <div class="mt-8 flex gap-4">
              @if (authService.isAuthenticated()) {
                <p-button
                  label="Solicitar recuperacion"
                  (onClick)="solicitarRecuperacion()"
                  icon="pi pi-check"
                />
              } @else {
                <p-button
                  label="Inicia sesion para reclamar"
                  routerLink="/login"
                  icon="pi pi-sign-in"
                />
              }
              <p-button
                label="Volver a la galeria"
                routerLink="/galeria"
                [outlined]="true"
                icon="pi pi-arrow-left"
              />
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class ObjetoDetalleComponent implements OnInit {
  private objetoService = inject(ObjetoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  authService = inject(AuthService);

  objeto = signal<Objeto | null>(null);
  loading = signal(true);
  error = signal('');

  images = computed<GalleriaImage[]>(() => {
    const obj = this.objeto();
    if (!obj?.fotos || obj.fotos.length === 0) {
      return [];
    }
    return obj.fotos.map(foto => ({
      url: foto.url,
      thumbnailUrl: foto.thumbnailUrl || foto.url,
      alt: obj.titulo
    }));
  });

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadObjeto(+id);
  }

  private loadObjeto(id: number) {
    this.objetoService.getObjeto(id).subscribe({
      next: (objeto) => {
        this.objeto.set(objeto);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Error al cargar el objeto');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Error al cargar el objeto'
        });
      }
    });
  }

  solicitarRecuperacion() {
    const obj = this.objeto();
    if (obj) {
      this.router.navigate(['/mis-objetos'], {
        queryParams: { solicitar: obj.id }
      });
    }
  }
}
