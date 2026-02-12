import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface Lote {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  estado: string;
  fechaCreacion: string;
  fechaCierre?: string;
  objetos: any[];
}

@Component({
  selector: 'app-lotes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="m-0 text-2xl font-bold text-gray-800">Gestion de lotes</h1>
        <button class="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark" (click)="abrirModalLote()">
          + Nuevo lote
        </button>
      </div>

      <div class="flex gap-4 mb-6">
        <select [(ngModel)]="filtroTipo" (change)="cargarLotes()" class="px-4 py-2 border border-gray-300 rounded text-sm">
          <option value="">Todos los tipos</option>
          <option value="SUBASTA">Subasta</option>
          <option value="DONACION">Donacion</option>
          <option value="RECICLAJE">Reciclaje</option>
          <option value="DESTRUCCION">Destruccion</option>
        </select>
        <select [(ngModel)]="filtroEstado" (change)="cargarLotes()" class="px-4 py-2 border border-gray-300 rounded text-sm">
          <option value="">Todos los estados</option>
          <option value="PREPARACION">En preparacion</option>
          <option value="PUBLICADO">Publicado</option>
          <option value="EN_CURSO">En curso</option>
          <option value="CERRADO">Cerrado</option>
        </select>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-500 bg-white rounded-lg">Cargando lotes...</div>
      } @else if (lotes().length === 0) {
        <div class="text-center py-12 text-gray-500 bg-white rounded-lg">
          <p>No hay lotes {{ filtroTipo || filtroEstado ? 'con estos filtros' : '' }}</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (lote of lotes(); track lote.id) {
            <div class="bg-white rounded-xl shadow-md overflow-hidden">
              <div class="flex justify-between p-6 bg-gray-50">
                <div>
                  <span class="text-xs text-gray-400">{{ lote.codigo }}</span>
                  <h3 class="m-0 mt-1 text-lg font-semibold">{{ lote.nombre }}</h3>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="px-2 py-1 rounded text-xs font-semibold text-center"
                    [class]="lote.tipo === 'SUBASTA' ? 'bg-blue-100 text-blue-800' :
                             lote.tipo === 'DONACION' ? 'bg-green-100 text-green-800' :
                             lote.tipo === 'RECICLAJE' ? 'bg-orange-100 text-orange-800' :
                             'bg-red-100 text-red-800'">
                    {{ lote.tipo }}
                  </span>
                  <span class="px-2 py-1 rounded text-xs font-semibold text-center"
                    [class]="lote.estado === 'PREPARACION' ? 'bg-yellow-100 text-yellow-800' :
                             lote.estado === 'PUBLICADO' ? 'bg-blue-100 text-blue-800' :
                             lote.estado === 'EN_CURSO' ? 'bg-green-100 text-green-800' :
                             'bg-gray-100 text-gray-600'">
                    {{ lote.estado }}
                  </span>
                </div>
              </div>

              <div class="p-6">
                <div class="flex gap-2 mb-4">
                  @for (objeto of lote.objetos.slice(0, 4); track objeto.id) {
                    <div class="w-12 h-12 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                      @if (objeto.fotos?.length) {
                        <img [src]="objeto.fotos[0].thumbnailUrl" alt="" class="w-full h-full object-cover">
                      } @else {
                        <span>📦</span>
                      }
                    </div>
                  }
                  @if (lote.objetos.length > 4) {
                    <div class="w-12 h-12 rounded bg-primary text-white font-semibold text-sm flex items-center justify-center">
                      +{{ lote.objetos.length - 4 }}
                    </div>
                  }
                </div>

                <div>
                  <p class="m-0 mb-1 text-sm text-gray-500"><strong>{{ lote.objetos.length }}</strong> objeto(s)</p>
                  <p class="m-0 mb-1 text-sm text-gray-500">Creado: {{ lote.fechaCreacion | date:'dd/MM/yyyy' }}</p>
                  @if (lote.fechaCierre) {
                    <p class="m-0 text-sm text-gray-500">Cierre: {{ lote.fechaCierre | date:'dd/MM/yyyy' }}</p>
                  }
                </div>
              </div>

              <div class="flex gap-2 px-6 py-4 bg-gray-50 border-t border-gray-200">
                @if (lote.estado === 'PREPARACION') {
                  <button class="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50" (click)="gestionarObjetos(lote)">
                    Gestionar objetos
                  </button>
                  <button class="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary-dark" (click)="publicarLote(lote)">
                    Publicar
                  </button>
                }
                @if (lote.estado === 'PUBLICADO' && lote.tipo === 'SUBASTA') {
                  <button class="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary-dark" (click)="iniciarSubasta(lote)">
                    Iniciar subasta
                  </button>
                }
                <button class="bg-transparent border-none cursor-pointer text-base opacity-60 hover:opacity-100" (click)="editarLote(lote)">✏️</button>
              </div>
            </div>
          }
        </div>
      }

      @if (modalLote()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="cerrarModal()">
          <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6" (click)="$event.stopPropagation()">
            <h2 class="m-0 mb-6 text-xl font-semibold">{{ loteEditar ? 'Editar' : 'Nuevo' }} lote</h2>

            <div class="mb-4">
              <label class="block mb-2 font-medium">Nombre *</label>
              <input type="text" [(ngModel)]="formLote.nombre" placeholder="Nombre del lote" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
            </div>

            <div class="mb-4">
              <label class="block mb-2 font-medium">Tipo *</label>
              <select [(ngModel)]="formLote.tipo" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary bg-white">
                <option value="SUBASTA">Subasta</option>
                <option value="DONACION">Donacion</option>
                <option value="RECICLAJE">Reciclaje</option>
                <option value="DESTRUCCION">Destruccion</option>
              </select>
            </div>

            @if (formLote.tipo === 'SUBASTA') {
              <div class="grid grid-cols-2 gap-4">
                <div class="mb-4">
                  <label class="block mb-2 font-medium">Precio salida (€)</label>
                  <input type="number" [(ngModel)]="formLote.precioSalida" min="0" step="0.01" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
                </div>
                <div class="mb-4">
                  <label class="block mb-2 font-medium">Fecha cierre</label>
                  <input type="datetime-local" [(ngModel)]="formLote.fechaCierre" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
                </div>
              </div>
            }

            <div class="flex gap-4 justify-end mt-6">
              <button class="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50" (click)="cerrarModal()">Cancelar</button>
              <button class="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-70" (click)="guardarLote()" [disabled]="guardando()">
                {{ guardando() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (modalObjetos()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="cerrarModal()">
          <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <h2 class="m-0 mb-6 text-xl font-semibold">Objetos del lote: {{ loteSeleccionado?.nombre }}</h2>

            <div class="mb-6">
              <h4 class="m-0 mb-3 text-sm font-semibold">Objetos en el lote ({{ loteSeleccionado?.objetos?.length || 0 }})</h4>
              @if (!loteSeleccionado?.objetos?.length) {
                <p class="text-gray-400 py-4 text-center bg-gray-50 rounded">No hay objetos en este lote</p>
              } @else {
                <div class="max-h-48 overflow-y-auto">
                  @for (objeto of loteSeleccionado?.objetos; track objeto.id) {
                    <div class="flex justify-between items-center p-2 border-b border-gray-200">
                      <span class="text-sm">{{ objeto.codigoUnico }} - {{ objeto.titulo }}</span>
                      <button class="bg-transparent border-none cursor-pointer text-base" (click)="quitarDelLote(objeto.id)">❌</button>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="mb-6">
              <h4 class="m-0 mb-3 text-sm font-semibold">Objetos disponibles</h4>
              <input
                type="text"
                [(ngModel)]="busquedaObjeto"
                placeholder="Buscar objeto..."
                (keyup)="buscarObjetos()"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary mb-3"
              >
              <div class="max-h-48 overflow-y-auto">
                @for (objeto of objetosDisponibles(); track objeto.id) {
                  <div class="flex justify-between items-center p-2 border-b border-gray-200">
                    <span class="text-sm">{{ objeto.codigoUnico }} - {{ objeto.titulo }}</span>
                    <button class="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50" (click)="agregarAlLote(objeto.id)">Agregar</button>
                  </div>
                }
              </div>
            </div>

            <div class="flex gap-4 justify-end mt-6">
              <button class="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark" (click)="cerrarModal()">Cerrar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class LotesAdminComponent implements OnInit {
  private api = inject(ApiService);

  lotes = signal<Lote[]>([]);
  loading = signal(true);
  guardando = signal(false);
  filtroTipo = '';
  filtroEstado = '';

  modalLote = signal(false);
  modalObjetos = signal(false);
  loteEditar: Lote | null = null;
  loteSeleccionado: Lote | null = null;

  formLote = {
    nombre: '',
    tipo: 'SUBASTA',
    precioSalida: 0,
    fechaCierre: ''
  };

  objetosDisponibles = signal<any[]>([]);
  busquedaObjeto = '';

  ngOnInit() {
    this.cargarLotes();
  }

  cargarLotes() {
    this.loading.set(true);
    let url = '/admin/lotes?';
    if (this.filtroTipo) url += `tipo=${this.filtroTipo}&`;
    if (this.filtroEstado) url += `estado=${this.filtroEstado}`;

    this.api.get<Lote[]>(url).subscribe({
      next: (data) => {
        this.lotes.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  abrirModalLote(lote?: Lote) {
    this.loteEditar = lote || null;
    this.formLote = lote
      ? { nombre: lote.nombre, tipo: lote.tipo, precioSalida: 0, fechaCierre: lote.fechaCierre || '' }
      : { nombre: '', tipo: 'SUBASTA', precioSalida: 0, fechaCierre: '' };
    this.modalLote.set(true);
  }

  editarLote(lote: Lote) {
    this.abrirModalLote(lote);
  }

  gestionarObjetos(lote: Lote) {
    this.loteSeleccionado = lote;
    this.buscarObjetos();
    this.modalObjetos.set(true);
  }

  cerrarModal() {
    this.modalLote.set(false);
    this.modalObjetos.set(false);
    this.loteEditar = null;
    this.loteSeleccionado = null;
  }

  guardarLote() {
    if (!this.formLote.nombre) return;
    this.guardando.set(true);

    const request = this.loteEditar
      ? this.api.put(`/admin/lotes/${this.loteEditar.id}`, this.formLote)
      : this.api.post('/admin/lotes', this.formLote);

    request.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarLotes();
      },
      error: () => this.guardando.set(false)
    });
  }

  publicarLote(lote: Lote) {
    if (!confirm('¿Publicar este lote?')) return;
    this.api.post(`/admin/lotes/${lote.id}/publicar`, {}).subscribe({
      next: () => this.cargarLotes()
    });
  }

  iniciarSubasta(lote: Lote) {
    if (!confirm('¿Iniciar la subasta de este lote?')) return;
    this.api.post(`/admin/lotes/${lote.id}/iniciar-subasta`, {}).subscribe({
      next: () => this.cargarLotes()
    });
  }

  buscarObjetos() {
    const params = this.busquedaObjeto ? `?q=${this.busquedaObjeto}` : '';
    this.api.get<any[]>(`/admin/objetos/disponibles-lote${params}`).subscribe({
      next: (data) => this.objetosDisponibles.set(data)
    });
  }

  agregarAlLote(objetoId: number) {
    if (!this.loteSeleccionado) return;
    this.api.post(`/admin/lotes/${this.loteSeleccionado.id}/objetos/${objetoId}`, {}).subscribe({
      next: () => {
        this.cargarLotes();
        this.buscarObjetos();
        const lote = this.lotes().find(l => l.id === this.loteSeleccionado?.id);
        if (lote) this.loteSeleccionado = lote;
      }
    });
  }

  quitarDelLote(objetoId: number) {
    if (!this.loteSeleccionado) return;
    this.api.delete(`/admin/lotes/${this.loteSeleccionado.id}/objetos/${objetoId}`).subscribe({
      next: () => {
        this.cargarLotes();
        this.buscarObjetos();
        const lote = this.lotes().find(l => l.id === this.loteSeleccionado?.id);
        if (lote) this.loteSeleccionado = lote;
      }
    });
  }
}
