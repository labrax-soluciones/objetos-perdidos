import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface Almacen {
  id: number;
  nombre: string;
  direccion: string;
  activo: boolean;
  ubicaciones: Ubicacion[];
}

interface Ubicacion {
  id: number;
  codigo: string;
  tipo: string;
  capacidad: number;
  ocupacionActual: number;
  hijos?: Ubicacion[];
}

@Component({
  selector: 'app-almacen-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="m-0 text-2xl font-bold text-gray-800">Gestion de almacen</h1>
        <button class="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark" (click)="abrirModalAlmacen()">
          + Nuevo almacen
        </button>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-500 bg-white rounded-lg">Cargando almacenes...</div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          @for (almacen of almacenes(); track almacen.id) {
            <div class="bg-white rounded-xl shadow-md overflow-hidden" [class.opacity-60]="!almacen.activo">
              <div class="flex justify-between p-6 bg-gray-50">
                <div>
                  <h2 class="m-0 mb-1 text-xl font-semibold">{{ almacen.nombre }}</h2>
                  <p class="m-0 text-gray-500 text-sm">{{ almacen.direccion }}</p>
                </div>
                <div class="flex gap-2">
                  <button class="bg-transparent border-none text-base cursor-pointer opacity-60 hover:opacity-100" (click)="editarAlmacen(almacen)" title="Editar">
                    ✏️
                  </button>
                </div>
              </div>

              <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="m-0 text-base font-semibold">Ubicaciones</h3>
                  <button class="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50" (click)="abrirModalUbicacion(almacen)">
                    + Anadir
                  </button>
                </div>

                @if (almacen.ubicaciones.length === 0) {
                  <p class="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">No hay ubicaciones configuradas</p>
                } @else {
                  <div class="flex flex-col gap-2">
                    @for (ubicacion of almacen.ubicaciones; track ubicacion.id) {
                      <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border-l-4"
                        [class.border-primary]="ubicacion.tipo === 'ESTANTERIA'"
                        [class.border-green-500]="ubicacion.tipo === 'BALDA'"
                        [class.border-orange-500]="ubicacion.tipo === 'CASILLERO'"
                        [class.border-purple-500]="ubicacion.tipo === 'CAJA'">
                        <div class="flex-1">
                          <span class="font-semibold font-mono">{{ ubicacion.codigo }}</span>
                          <span class="text-xs text-gray-400 ml-2">{{ ubicacion.tipo }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <div class="w-20 h-2 bg-gray-200 rounded overflow-hidden">
                            <div
                              class="h-full rounded transition-all duration-300"
                              [class]="ubicacion.ocupacionActual >= ubicacion.capacidad ? 'bg-red-500' : 'bg-green-500'"
                              [style.width.%]="(ubicacion.ocupacionActual / ubicacion.capacidad) * 100"
                            ></div>
                          </div>
                          <span class="text-xs text-gray-500 min-w-[40px]">
                            {{ ubicacion.ocupacionActual }}/{{ ubicacion.capacidad }}
                          </span>
                        </div>
                        <button class="bg-transparent border-none cursor-pointer text-base opacity-60 hover:opacity-100" (click)="eliminarUbicacion(ubicacion.id)" title="Eliminar">
                          🗑️
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="flex border-t border-gray-200">
                <div class="flex-1 text-center py-4 border-r border-gray-200">
                  <span class="block text-2xl font-bold text-primary">{{ getTotalUbicaciones(almacen) }}</span>
                  <span class="text-xs text-gray-400">Ubicaciones</span>
                </div>
                <div class="flex-1 text-center py-4 border-r border-gray-200">
                  <span class="block text-2xl font-bold text-primary">{{ getOcupacionTotal(almacen) }}</span>
                  <span class="text-xs text-gray-400">Objetos</span>
                </div>
                <div class="flex-1 text-center py-4">
                  <span class="block text-2xl font-bold text-primary">{{ getCapacidadTotal(almacen) }}</span>
                  <span class="text-xs text-gray-400">Capacidad</span>
                </div>
              </div>
            </div>
          }
        </div>

        @if (almacenes().length === 0) {
          <div class="text-center py-12 text-gray-500 bg-white rounded-lg">
            <p>No hay almacenes configurados</p>
            <button class="px-6 py-3 bg-primary text-white rounded-lg font-medium mt-4 hover:bg-primary-dark" (click)="abrirModalAlmacen()">
              Crear primer almacen
            </button>
          </div>
        }
      }

      @if (modalAlmacen()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="cerrarModales()">
          <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6" (click)="$event.stopPropagation()">
            <h2 class="m-0 mb-6 text-xl font-semibold">{{ almacenEditar ? 'Editar' : 'Nuevo' }} almacen</h2>

            <div class="mb-4">
              <label class="block mb-2 font-medium">Nombre *</label>
              <input type="text" [(ngModel)]="formAlmacen.nombre" placeholder="Nombre del almacen" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
            </div>

            <div class="mb-4">
              <label class="block mb-2 font-medium">Direccion</label>
              <input type="text" [(ngModel)]="formAlmacen.direccion" placeholder="Direccion" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
            </div>

            <div class="mb-4">
              <label class="flex items-center gap-2 font-normal cursor-pointer">
                <input type="checkbox" [(ngModel)]="formAlmacen.activo">
                Almacen activo
              </label>
            </div>

            <div class="flex gap-4 justify-end mt-6">
              <button class="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50" (click)="cerrarModales()">Cancelar</button>
              <button class="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-70" (click)="guardarAlmacen()" [disabled]="guardando()">
                {{ guardando() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (modalUbicacion()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="cerrarModales()">
          <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6" (click)="$event.stopPropagation()">
            <h2 class="m-0 mb-2 text-xl font-semibold">Nueva ubicacion</h2>
            <p class="text-gray-500 m-0 mb-6">Almacen: {{ almacenSeleccionado?.nombre }}</p>

            <div class="mb-4">
              <label class="block mb-2 font-medium">Codigo *</label>
              <input
                type="text"
                [(ngModel)]="formUbicacion.codigo"
                placeholder="Ej: E1-B3-C2"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              >
              <small class="block mt-1 text-gray-400 text-xs">Ejemplo: E1 (Estanteria 1), E1-B3 (Balda 3), E1-B3-C2 (Casillero 2)</small>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="mb-4">
                <label class="block mb-2 font-medium">Tipo *</label>
                <select [(ngModel)]="formUbicacion.tipo" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary bg-white">
                  <option value="ESTANTERIA">Estanteria</option>
                  <option value="BALDA">Balda</option>
                  <option value="CASILLERO">Casillero</option>
                  <option value="CAJA">Caja</option>
                </select>
              </div>

              <div class="mb-4">
                <label class="block mb-2 font-medium">Capacidad *</label>
                <input type="number" [(ngModel)]="formUbicacion.capacidad" min="1" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
              </div>
            </div>

            <div class="flex gap-4 justify-end mt-6">
              <button class="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50" (click)="cerrarModales()">Cancelar</button>
              <button class="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-70" (click)="guardarUbicacion()" [disabled]="guardando()">
                {{ guardando() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class AlmacenAdminComponent implements OnInit {
  private api = inject(ApiService);

  almacenes = signal<Almacen[]>([]);
  loading = signal(true);
  guardando = signal(false);

  modalAlmacen = signal(false);
  modalUbicacion = signal(false);

  almacenEditar: Almacen | null = null;
  almacenSeleccionado: Almacen | null = null;

  formAlmacen = {
    nombre: '',
    direccion: '',
    activo: true
  };

  formUbicacion = {
    codigo: '',
    tipo: 'CASILLERO',
    capacidad: 10
  };

  ngOnInit() {
    this.cargarAlmacenes();
  }

  private cargarAlmacenes() {
    this.loading.set(true);
    this.api.get<Almacen[]>('/admin/almacenes').subscribe({
      next: (data) => {
        this.almacenes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getTotalUbicaciones(almacen: Almacen): number {
    return almacen.ubicaciones.length;
  }

  getOcupacionTotal(almacen: Almacen): number {
    return almacen.ubicaciones.reduce((sum, u) => sum + u.ocupacionActual, 0);
  }

  getCapacidadTotal(almacen: Almacen): number {
    return almacen.ubicaciones.reduce((sum, u) => sum + u.capacidad, 0);
  }

  abrirModalAlmacen(almacen?: Almacen) {
    this.almacenEditar = almacen || null;
    this.formAlmacen = almacen
      ? { nombre: almacen.nombre, direccion: almacen.direccion, activo: almacen.activo }
      : { nombre: '', direccion: '', activo: true };
    this.modalAlmacen.set(true);
  }

  editarAlmacen(almacen: Almacen) {
    this.abrirModalAlmacen(almacen);
  }

  abrirModalUbicacion(almacen: Almacen) {
    this.almacenSeleccionado = almacen;
    this.formUbicacion = { codigo: '', tipo: 'CASILLERO', capacidad: 10 };
    this.modalUbicacion.set(true);
  }

  cerrarModales() {
    this.modalAlmacen.set(false);
    this.modalUbicacion.set(false);
    this.almacenEditar = null;
    this.almacenSeleccionado = null;
  }

  guardarAlmacen() {
    if (!this.formAlmacen.nombre) return;

    this.guardando.set(true);
    const request = this.almacenEditar
      ? this.api.put(`/admin/almacenes/${this.almacenEditar.id}`, this.formAlmacen)
      : this.api.post('/admin/almacenes', this.formAlmacen);

    request.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModales();
        this.cargarAlmacenes();
      },
      error: () => {
        this.guardando.set(false);
      }
    });
  }

  guardarUbicacion() {
    if (!this.almacenSeleccionado || !this.formUbicacion.codigo) return;

    this.guardando.set(true);
    this.api.post(`/admin/almacenes/${this.almacenSeleccionado.id}/ubicaciones`, this.formUbicacion).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModales();
        this.cargarAlmacenes();
      },
      error: () => {
        this.guardando.set(false);
      }
    });
  }

  eliminarUbicacion(ubicacionId: number) {
    if (!confirm('¿Eliminar esta ubicacion?')) return;

    this.api.delete(`/admin/ubicaciones/${ubicacionId}`).subscribe({
      next: () => {
        this.cargarAlmacenes();
      }
    });
  }
}
