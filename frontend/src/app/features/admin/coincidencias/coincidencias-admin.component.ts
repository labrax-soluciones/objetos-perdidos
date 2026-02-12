import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface Coincidencia {
  id: number;
  objetoEncontrado: {
    id: number;
    codigoUnico: string;
    titulo: string;
    fotos?: { thumbnailUrl: string }[];
  };
  objetoPerdido: {
    id: number;
    titulo: string;
    usuario: { nombre: string; email: string };
    fotos?: { thumbnailUrl: string }[];
  };
  puntuacion: number;
  estado: string;
  createdAt: string;
}

@Component({
  selector: 'app-coincidencias-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-8">
      <div class="mb-8">
        <h1 class="m-0 mb-2 text-2xl font-bold text-gray-800">Coincidencias</h1>
        <p class="text-gray-500 m-0">Revisa las posibles coincidencias entre objetos encontrados y perdidos</p>
      </div>

      <div class="flex gap-2 mb-8">
        <button
          class="px-6 py-2 border rounded-full text-sm cursor-pointer transition-colors"
          [class]="filtro() === 'PENDIENTE' ? 'bg-primary text-white border-primary' : 'bg-white border-gray-300 hover:bg-gray-50'"
          (click)="filtrar('PENDIENTE')"
        >
          Pendientes
        </button>
        <button
          class="px-6 py-2 border rounded-full text-sm cursor-pointer transition-colors"
          [class]="filtro() === 'CONFIRMADA' ? 'bg-primary text-white border-primary' : 'bg-white border-gray-300 hover:bg-gray-50'"
          (click)="filtrar('CONFIRMADA')"
        >
          Confirmadas
        </button>
        <button
          class="px-6 py-2 border rounded-full text-sm cursor-pointer transition-colors"
          [class]="filtro() === 'DESCARTADA' ? 'bg-primary text-white border-primary' : 'bg-white border-gray-300 hover:bg-gray-50'"
          (click)="filtrar('DESCARTADA')"
        >
          Descartadas
        </button>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-500 bg-white rounded-lg">Cargando coincidencias...</div>
      } @else if (coincidencias().length === 0) {
        <div class="text-center py-12 text-gray-500 bg-white rounded-lg">
          <p>No hay coincidencias {{ filtro().toLowerCase() }}s</p>
        </div>
      } @else {
        <div class="flex flex-col gap-6">
          @for (coincidencia of coincidencias(); track coincidencia.id) {
            <div class="bg-white rounded-xl shadow-md p-8">
              <div class="text-center mb-6">
                <div class="inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold text-white"
                  [class]="coincidencia.puntuacion >= 70 ? 'bg-green-500' : coincidencia.puntuacion >= 40 ? 'bg-orange-500' : 'bg-gray-400'">
                  {{ coincidencia.puntuacion }}%
                </div>
                <span class="block mt-2 text-sm text-gray-500">Coincidencia</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div class="text-center">
                  <span class="inline-block px-3 py-1 rounded text-xs font-semibold mb-4 bg-green-100 text-green-800">Encontrado</span>
                  <div class="w-36 h-36 mx-auto mb-4 rounded-lg overflow-hidden bg-gray-100">
                    @if (coincidencia.objetoEncontrado.fotos?.length) {
                      <img [src]="coincidencia.objetoEncontrado.fotos![0].thumbnailUrl" alt="" class="w-full h-full object-cover">
                    } @else {
                      <div class="h-full flex items-center justify-center text-5xl">📦</div>
                    }
                  </div>
                  <p class="text-xs text-gray-400 m-0">{{ coincidencia.objetoEncontrado.codigoUnico }}</p>
                  <p class="font-semibold m-0 mt-1">{{ coincidencia.objetoEncontrado.titulo }}</p>
                  <a [routerLink]="['/admin/objetos', coincidencia.objetoEncontrado.id]" class="text-primary no-underline text-sm">
                    Ver detalle
                  </a>
                </div>

                <div class="text-2xl font-bold text-gray-300 self-center text-center hidden md:block">VS</div>

                <div class="text-center">
                  <span class="inline-block px-3 py-1 rounded text-xs font-semibold mb-4 bg-red-100 text-red-800">Perdido</span>
                  <div class="w-36 h-36 mx-auto mb-4 rounded-lg overflow-hidden bg-gray-100">
                    @if (coincidencia.objetoPerdido.fotos?.length) {
                      <img [src]="coincidencia.objetoPerdido.fotos![0].thumbnailUrl" alt="" class="w-full h-full object-cover">
                    } @else {
                      <div class="h-full flex items-center justify-center text-5xl">❓</div>
                    }
                  </div>
                  <p class="font-semibold m-0 mt-1">{{ coincidencia.objetoPerdido.titulo }}</p>
                  <p class="text-sm text-gray-500 m-0 mt-1">
                    Reportado por: {{ coincidencia.objetoPerdido.usuario.nombre }}
                  </p>
                  <p class="text-sm text-gray-500 m-0">{{ coincidencia.objetoPerdido.usuario.email }}</p>
                </div>
              </div>

              <div class="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <span class="text-sm text-gray-400">{{ coincidencia.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>

                @if (coincidencia.estado === 'PENDIENTE') {
                  <div class="flex gap-4">
                    <button
                      class="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-70"
                      (click)="confirmar(coincidencia)"
                      [disabled]="procesando()"
                    >
                      Confirmar
                    </button>
                    <button
                      class="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-70"
                      (click)="descartar(coincidencia)"
                      [disabled]="procesando()"
                    >
                      Descartar
                    </button>
                  </div>
                } @else {
                  <span class="px-3 py-1 rounded text-xs font-semibold"
                    [class]="coincidencia.estado === 'CONFIRMADA' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'">
                    {{ coincidencia.estado }}
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: []
})
export class CoincidenciasAdminComponent implements OnInit {
  private api = inject(ApiService);

  coincidencias = signal<Coincidencia[]>([]);
  loading = signal(true);
  filtro = signal<'PENDIENTE' | 'CONFIRMADA' | 'DESCARTADA'>('PENDIENTE');
  procesando = signal(false);

  ngOnInit() {
    this.cargarCoincidencias();
  }

  filtrar(estado: 'PENDIENTE' | 'CONFIRMADA' | 'DESCARTADA') {
    this.filtro.set(estado);
    this.cargarCoincidencias();
  }

  private cargarCoincidencias() {
    this.loading.set(true);
    this.api.get<Coincidencia[]>(`/admin/coincidencias?estado=${this.filtro()}`).subscribe({
      next: (data) => {
        this.coincidencias.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getPuntuacionClass(puntuacion: number): string {
    if (puntuacion >= 70) return 'alta';
    if (puntuacion >= 40) return 'media';
    return 'baja';
  }

  confirmar(coincidencia: Coincidencia) {
    if (!confirm('¿Confirmar esta coincidencia? Se notificara al ciudadano.')) return;

    this.procesando.set(true);
    this.api.put(`/admin/coincidencias/${coincidencia.id}/confirmar`, {}).subscribe({
      next: () => {
        this.procesando.set(false);
        this.cargarCoincidencias();
      },
      error: () => {
        this.procesando.set(false);
      }
    });
  }

  descartar(coincidencia: Coincidencia) {
    if (!confirm('¿Descartar esta coincidencia?')) return;

    this.procesando.set(true);
    this.api.put(`/admin/coincidencias/${coincidencia.id}/descartar`, {}).subscribe({
      next: () => {
        this.procesando.set(false);
        this.cargarCoincidencias();
      },
      error: () => {
        this.procesando.set(false);
      }
    });
  }
}
