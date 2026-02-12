import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

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
  ganador?: {
    id: number;
    nombre: string;
  };
  pujas: Puja[];
}

interface Puja {
  id: number;
  cantidad: number;
  createdAt: string;
  usuario: {
    id: number;
    nombre: string;
  };
}

@Component({
  selector: 'app-subasta-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto p-8">
      @if (loading()) {
        <div class="text-center py-12 text-gray-500">Cargando subasta...</div>
      } @else if (error()) {
        <div class="text-center py-12 text-red-600">{{ error() }}</div>
      } @else if (subasta()) {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div class="lg:sticky lg:top-8 lg:self-start">
            <div class="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden">
              @if (imagenActual()) {
                <img [src]="imagenActual()" alt="Lote" class="w-full h-full object-contain">
              } @else {
                <div class="h-full flex items-center justify-center text-gray-400">Sin imagenes</div>
              }
            </div>
            @if (todasImagenes().length > 1) {
              <div class="flex gap-2 mt-4 overflow-x-auto">
                @for (img of todasImagenes(); track img) {
                  <img
                    [src]="img"
                    class="w-20 h-20 object-cover rounded cursor-pointer transition-opacity duration-200"
                    [class]="imagenActual() === img ? 'opacity-100' : 'opacity-60 hover:opacity-100'"
                    (click)="seleccionarImagen(img)"
                    alt="Miniatura"
                  >
                }
              </div>
            }

            <div class="mt-8 pt-8 border-t border-gray-200">
              <h3 class="m-0 mb-4 text-base">Objetos incluidos ({{ subasta()!.lote.objetos.length }})</h3>
              <div class="flex flex-col gap-3">
                @for (objeto of subasta()!.lote.objetos; track objeto.id) {
                  <div class="flex gap-4 p-3 bg-gray-50 rounded-lg">
                    <div class="w-[50px] h-[50px] rounded overflow-hidden bg-gray-200 flex-shrink-0">
                      @if (objeto.fotos?.length > 0) {
                        <img [src]="objeto.fotos[0].thumbnailUrl" [alt]="objeto.titulo" class="w-full h-full object-cover">
                      }
                    </div>
                    <div class="flex flex-col justify-center">
                      <strong class="text-sm">{{ objeto.titulo }}</strong>
                      <span class="text-xs text-gray-400">{{ objeto.categoria?.nombre }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="py-4">
            <span class="text-sm text-gray-400 uppercase">Lote {{ subasta()!.lote.codigo }}</span>
            <h1 class="mt-2 mb-6 text-3xl">{{ subasta()!.lote.nombre }}</h1>

            <div class="flex items-center gap-4 mb-6">
              <span class="px-4 py-1.5 rounded text-sm font-semibold"
                [ngClass]="{
                  'bg-green-500 text-white': subasta()!.estado.toLowerCase() === 'activa',
                  'bg-orange-500 text-white': subasta()!.estado.toLowerCase() === 'programada',
                  'bg-gray-500 text-white': subasta()!.estado.toLowerCase() === 'cerrada' || subasta()!.estado.toLowerCase() === 'adjudicada'
                }">
                {{ getEstadoLabel(subasta()!.estado) }}
              </span>
              @if (subasta()!.estado === 'ACTIVA') {
                <span class="text-red-600 font-medium">
                  Termina en: {{ tiempoRestante() }}
                </span>
              }
            </div>

            <div class="bg-gray-50 p-6 rounded-xl mb-6">
              <div class="text-center mb-2">
                <span class="block text-sm text-gray-500">Puja actual</span>
                <span class="text-4xl font-bold text-primary">{{ subasta()!.precioActual | currency:'EUR' }}</span>
              </div>
              <div class="text-center text-sm text-gray-400">
                Precio salida: {{ subasta()!.precioSalida | currency:'EUR' }}
              </div>
            </div>

            @if (subasta()!.estado === 'ACTIVA') {
              @if (authService.isAuthenticated()) {
                <div class="bg-indigo-50 p-6 rounded-xl mb-6">
                  <label class="block mb-2 font-medium">Tu puja (minimo {{ pujaMinima() | currency:'EUR' }})</label>
                  <div class="flex gap-2">
                    <input
                      type="number"
                      [(ngModel)]="cantidadPuja"
                      [min]="pujaMinima()"
                      step="1"
                      class="flex-1 py-3 px-3 border border-gray-300 rounded-md text-xl"
                    >
                    <button
                      class="py-3 px-6 border-none rounded-md text-base font-medium cursor-pointer bg-primary text-white disabled:opacity-70 disabled:cursor-not-allowed"
                      (click)="pujar()"
                      [disabled]="enviandoPuja() || cantidadPuja < pujaMinima()"
                    >
                      {{ enviandoPuja() ? 'Enviando...' : 'Pujar' }}
                    </button>
                  </div>
                  @if (errorPuja()) {
                    <p class="text-red-600 mt-2 mb-0 text-sm">{{ errorPuja() }}</p>
                  }
                  @if (exitoPuja()) {
                    <p class="text-green-700 mt-2 mb-0 text-sm">{{ exitoPuja() }}</p>
                  }
                </div>
              } @else {
                <a routerLink="/login" class="block w-full py-3.5 px-6 border-none rounded-md text-base font-medium text-center no-underline cursor-pointer bg-primary text-white mb-6">
                  Inicia sesion para pujar
                </a>
              }
            } @else if (subasta()!.estado === 'ADJUDICADA' && subasta()!.ganador) {
              <div class="bg-green-100 p-6 rounded-xl text-center mb-6">
                <span class="block text-sm text-gray-500">Ganador</span>
                <span class="block text-2xl font-semibold text-green-700">{{ subasta()!.ganador!.nombre }}</span>
                <span class="block text-base text-gray-500">{{ subasta()!.precioActual | currency:'EUR' }}</span>
              </div>
            }

            <div class="my-8">
              <h3 class="m-0 mb-4">Historial de pujas ({{ subasta()!.pujas?.length || 0 }})</h3>
              @if (!subasta()!.pujas || subasta()!.pujas.length === 0) {
                <p class="text-gray-400 text-center py-8 bg-gray-50 rounded-lg">Aun no hay pujas</p>
              } @else {
                <div class="max-h-[300px] overflow-y-auto">
                  @for (puja of subasta()!.pujas; track puja.id; let i = $index) {
                    <div class="flex justify-between items-center py-3 px-3 border-b border-gray-200"
                      [class.bg-green-100]="i === 0 && subasta()!.estado !== 'ACTIVA'"
                      [class.rounded]="i === 0 && subasta()!.estado !== 'ACTIVA'">
                      <div class="flex flex-col">
                        <span class="font-medium">{{ puja.usuario.nombre }}</span>
                        <span class="text-xs text-gray-400">{{ puja.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                      <span class="font-semibold text-primary">{{ puja.cantidad | currency:'EUR' }}</span>
                    </div>
                  }
                </div>
              }
            </div>

            <a routerLink="/subastas" class="block w-full py-3.5 px-6 rounded-md text-base font-medium text-center no-underline cursor-pointer bg-white border border-gray-300 text-gray-800">
              Volver a subastas
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class SubastaDetalleComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  authService = inject(AuthService);

  subasta = signal<Subasta | null>(null);
  loading = signal(true);
  error = signal('');

  imagenActual = signal('');
  todasImagenes = signal<string[]>([]);

  cantidadPuja = 0;
  enviandoPuja = signal(false);
  errorPuja = signal('');
  exitoPuja = signal('');

  tiempoRestante = signal('');
  private timerInterval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadSubasta(+id);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private loadSubasta(id: number) {
    this.loading.set(true);
    this.api.get<Subasta>(`/subastas/${id}`).subscribe({
      next: (subasta) => {
        this.subasta.set(subasta);
        this.prepararImagenes(subasta);
        this.cantidadPuja = this.pujaMinima();
        this.iniciarContador(subasta);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Error al cargar la subasta');
      }
    });
  }

  private prepararImagenes(subasta: Subasta) {
    const imagenes: string[] = [];
    subasta.lote.objetos.forEach(obj => {
      if (obj.fotos) {
        obj.fotos.forEach((foto: any) => {
          imagenes.push(foto.url);
        });
      }
    });
    this.todasImagenes.set(imagenes);
    if (imagenes.length > 0) {
      this.imagenActual.set(imagenes[0]);
    }
  }

  private iniciarContador(subasta: Subasta) {
    if (subasta.estado !== 'ACTIVA') return;

    const actualizarTiempo = () => {
      const ahora = new Date().getTime();
      const fin = new Date(subasta.fechaFin).getTime();
      const diferencia = fin - ahora;

      if (diferencia <= 0) {
        this.tiempoRestante.set('Finalizada');
        if (this.timerInterval) clearInterval(this.timerInterval);
        return;
      }

      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

      if (dias > 0) {
        this.tiempoRestante.set(`${dias}d ${horas}h ${minutos}m`);
      } else if (horas > 0) {
        this.tiempoRestante.set(`${horas}h ${minutos}m ${segundos}s`);
      } else {
        this.tiempoRestante.set(`${minutos}m ${segundos}s`);
      }
    };

    actualizarTiempo();
    this.timerInterval = setInterval(actualizarTiempo, 1000);
  }

  seleccionarImagen(url: string) {
    this.imagenActual.set(url);
  }

  pujaMinima(): number {
    const sub = this.subasta();
    if (!sub) return 0;
    return sub.precioActual + 1;
  }

  pujar() {
    const sub = this.subasta();
    if (!sub || this.cantidadPuja < this.pujaMinima()) return;

    this.enviandoPuja.set(true);
    this.errorPuja.set('');
    this.exitoPuja.set('');

    this.api.post(`/subastas/${sub.id}/pujar`, { cantidad: this.cantidadPuja }).subscribe({
      next: () => {
        this.enviandoPuja.set(false);
        this.exitoPuja.set('Puja realizada correctamente');
        this.loadSubasta(sub.id);
      },
      error: (err) => {
        this.enviandoPuja.set(false);
        this.errorPuja.set(err.message || 'Error al realizar la puja');
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
