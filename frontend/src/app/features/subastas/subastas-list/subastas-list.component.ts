import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface Subasta {
  id: number;
  lote: {
    id: number;
    codigo: string;
    nombre: string;
    objetos: any[];
  };
  precioSalida: number;
  precioActual: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  totalPujas: number;
}

@Component({
  selector: 'app-subastas-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto p-8">
      <div class="mb-8">
        <h1 class="m-0 mb-2">Subastas</h1>
        <p class="text-gray-500 m-0">Objetos perdidos no reclamados en mas de 2 anos</p>
      </div>

      <div class="flex flex-wrap gap-2 mb-8">
        <button
          class="px-6 py-2 border rounded-full cursor-pointer text-sm transition-all duration-200"
          [class]="filtroActivo() === 'activas' ? 'bg-primary text-white border-primary' : 'bg-white border-gray-300 hover:border-primary'"
          (click)="filtrar('activas')"
        >
          Activas
        </button>
        <button
          class="px-6 py-2 border rounded-full cursor-pointer text-sm transition-all duration-200"
          [class]="filtroActivo() === 'proximas' ? 'bg-primary text-white border-primary' : 'bg-white border-gray-300 hover:border-primary'"
          (click)="filtrar('proximas')"
        >
          Proximas
        </button>
        <button
          class="px-6 py-2 border rounded-full cursor-pointer text-sm transition-all duration-200"
          [class]="filtroActivo() === 'finalizadas' ? 'bg-primary text-white border-primary' : 'bg-white border-gray-300 hover:border-primary'"
          (click)="filtrar('finalizadas')"
        >
          Finalizadas
        </button>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-500">Cargando subastas...</div>
      } @else if (error()) {
        <div class="text-center py-12 text-red-600">{{ error() }}</div>
      } @else if (subastas().length === 0) {
        <div class="text-center py-16 bg-gray-50 rounded-lg text-gray-500">
          <p>No hay subastas {{ filtroActivo() }} en este momento</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (subasta of subastas(); track subasta.id) {
            <div class="bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
              <div class="relative h-[200px] bg-gray-100">
                @if (subasta.lote.objetos.length > 0 && subasta.lote.objetos[0].fotos?.length > 0) {
                  <img [src]="subasta.lote.objetos[0].fotos[0].thumbnailUrl" [alt]="subasta.lote.nombre" class="w-full h-full object-cover">
                } @else {
                  <div class="h-full flex items-center justify-center text-gray-400 text-xl">
                    <span>{{ subasta.lote.objetos.length }} objeto(s)</span>
                  </div>
                }
                <span class="absolute top-4 right-4 px-3 py-1 rounded text-xs font-semibold uppercase"
                  [ngClass]="{
                    'bg-green-500 text-white': subasta.estado.toLowerCase() === 'activa',
                    'bg-orange-500 text-white': subasta.estado.toLowerCase() === 'programada',
                    'bg-gray-500 text-white': subasta.estado.toLowerCase() === 'cerrada' || subasta.estado.toLowerCase() === 'adjudicada'
                  }">
                  {{ getEstadoLabel(subasta.estado) }}
                </span>
              </div>

              <div class="p-6">
                <span class="text-xs text-gray-400 uppercase">Lote {{ subasta.lote.codigo }}</span>
                <h3 class="mt-2 mb-4 text-xl">{{ subasta.lote.nombre }}</h3>

                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div class="text-center py-3 bg-gray-50 rounded-lg">
                    <span class="block text-xs text-gray-400 mb-1">Puja actual</span>
                    <span class="text-xl font-semibold text-primary">{{ subasta.precioActual | currency:'EUR' }}</span>
                  </div>
                  <div class="text-center py-3 bg-gray-50 rounded-lg">
                    <span class="block text-xs text-gray-400 mb-1">Precio salida</span>
                    <span class="text-base text-gray-500">{{ subasta.precioSalida | currency:'EUR' }}</span>
                  </div>
                </div>

                <div class="text-sm mb-3">
                  @if (subasta.estado === 'ACTIVA') {
                    <span class="text-red-600">
                      Termina: {{ subasta.fechaFin | date:'dd/MM/yyyy HH:mm' }}
                    </span>
                  } @else if (subasta.estado === 'PROGRAMADA') {
                    <span class="text-warning">
                      Inicia: {{ subasta.fechaInicio | date:'dd/MM/yyyy HH:mm' }}
                    </span>
                  } @else {
                    <span class="text-gray-400">
                      Finalizo: {{ subasta.fechaFin | date:'dd/MM/yyyy' }}
                    </span>
                  }
                </div>

                <div class="text-sm text-gray-500 mb-4">
                  {{ subasta.totalPujas }} puja(s)
                </div>

                <a [routerLink]="['/subastas', subasta.id]" class="block w-full py-3 border-none rounded-md text-base font-medium text-center no-underline cursor-pointer bg-primary text-white hover:bg-primary-dark">
                  @if (subasta.estado === 'ACTIVA') {
                    Pujar ahora
                  } @else {
                    Ver detalle
                  }
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: []
})
export class SubastasListComponent implements OnInit {
  private api = inject(ApiService);

  subastas = signal<Subasta[]>([]);
  loading = signal(true);
  error = signal('');
  filtroActivo = signal<'activas' | 'proximas' | 'finalizadas'>('activas');

  ngOnInit() {
    this.loadSubastas();
  }

  filtrar(filtro: 'activas' | 'proximas' | 'finalizadas') {
    this.filtroActivo.set(filtro);
    this.loadSubastas();
  }

  private loadSubastas() {
    this.loading.set(true);
    this.error.set('');

    const estado = this.filtroActivo() === 'activas' ? 'ACTIVA' :
                   this.filtroActivo() === 'proximas' ? 'PROGRAMADA' : 'CERRADA';

    this.api.get<Subasta[]>(`/subastas?estado=${estado}`).subscribe({
      next: (subastas) => {
        this.subastas.set(subastas);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Error al cargar las subastas');
      }
    });
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      'PROGRAMADA': 'Proxima',
      'ACTIVA': 'En curso',
      'CERRADA': 'Finalizada',
      'ADJUDICADA': 'Adjudicada'
    };
    return labels[estado] || estado;
  }
}
