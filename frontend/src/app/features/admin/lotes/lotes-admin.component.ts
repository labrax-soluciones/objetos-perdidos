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
    <div class="lotes-container">
      <div class="header">
        <h1>Gestion de lotes</h1>
        <button class="btn btn-primary" (click)="abrirModalLote()">
          + Nuevo lote
        </button>
      </div>

      <div class="filtros">
        <select [(ngModel)]="filtroTipo" (change)="cargarLotes()">
          <option value="">Todos los tipos</option>
          <option value="SUBASTA">Subasta</option>
          <option value="DONACION">Donacion</option>
          <option value="RECICLAJE">Reciclaje</option>
          <option value="DESTRUCCION">Destruccion</option>
        </select>
        <select [(ngModel)]="filtroEstado" (change)="cargarLotes()">
          <option value="">Todos los estados</option>
          <option value="PREPARACION">En preparacion</option>
          <option value="PUBLICADO">Publicado</option>
          <option value="EN_CURSO">En curso</option>
          <option value="CERRADO">Cerrado</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading">Cargando lotes...</div>
      } @else if (lotes().length === 0) {
        <div class="empty-state">
          <p>No hay lotes {{ filtroTipo || filtroEstado ? 'con estos filtros' : '' }}</p>
        </div>
      } @else {
        <div class="lotes-grid">
          @for (lote of lotes(); track lote.id) {
            <div class="lote-card">
              <div class="lote-header">
                <div>
                  <span class="lote-codigo">{{ lote.codigo }}</span>
                  <h3>{{ lote.nombre }}</h3>
                </div>
                <div class="badges">
                  <span class="tipo-badge" [class]="'tipo-' + lote.tipo.toLowerCase()">
                    {{ lote.tipo }}
                  </span>
                  <span class="estado-badge" [class]="'estado-' + lote.estado.toLowerCase()">
                    {{ lote.estado }}
                  </span>
                </div>
              </div>

              <div class="lote-body">
                <div class="objetos-preview">
                  @for (objeto of lote.objetos.slice(0, 4); track objeto.id) {
                    <div class="objeto-thumb">
                      @if (objeto.fotos?.length) {
                        <img [src]="objeto.fotos[0].thumbnailUrl" alt="">
                      } @else {
                        <span>📦</span>
                      }
                    </div>
                  }
                  @if (lote.objetos.length > 4) {
                    <div class="objeto-thumb mas">
                      +{{ lote.objetos.length - 4 }}
                    </div>
                  }
                </div>

                <div class="lote-info">
                  <p><strong>{{ lote.objetos.length }}</strong> objeto(s)</p>
                  <p>Creado: {{ lote.fechaCreacion | date:'dd/MM/yyyy' }}</p>
                  @if (lote.fechaCierre) {
                    <p>Cierre: {{ lote.fechaCierre | date:'dd/MM/yyyy' }}</p>
                  }
                </div>
              </div>

              <div class="lote-acciones">
                @if (lote.estado === 'PREPARACION') {
                  <button class="btn btn-sm" (click)="gestionarObjetos(lote)">
                    Gestionar objetos
                  </button>
                  <button class="btn btn-sm btn-primary" (click)="publicarLote(lote)">
                    Publicar
                  </button>
                }
                @if (lote.estado === 'PUBLICADO' && lote.tipo === 'SUBASTA') {
                  <button class="btn btn-sm btn-primary" (click)="iniciarSubasta(lote)">
                    Iniciar subasta
                  </button>
                }
                <button class="btn-icon" (click)="editarLote(lote)">✏️</button>
              </div>
            </div>
          }
        </div>
      }

      @if (modalLote()) {
        <div class="modal-overlay" (click)="cerrarModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>{{ loteEditar ? 'Editar' : 'Nuevo' }} lote</h2>

            <div class="form-group">
              <label>Nombre *</label>
              <input type="text" [(ngModel)]="formLote.nombre" placeholder="Nombre del lote">
            </div>

            <div class="form-group">
              <label>Tipo *</label>
              <select [(ngModel)]="formLote.tipo">
                <option value="SUBASTA">Subasta</option>
                <option value="DONACION">Donacion</option>
                <option value="RECICLAJE">Reciclaje</option>
                <option value="DESTRUCCION">Destruccion</option>
              </select>
            </div>

            @if (formLote.tipo === 'SUBASTA') {
              <div class="form-row">
                <div class="form-group">
                  <label>Precio salida (€)</label>
                  <input type="number" [(ngModel)]="formLote.precioSalida" min="0" step="0.01">
                </div>
                <div class="form-group">
                  <label>Fecha cierre</label>
                  <input type="datetime-local" [(ngModel)]="formLote.fechaCierre">
                </div>
              </div>
            }

            <div class="modal-acciones">
              <button class="btn btn-outline" (click)="cerrarModal()">Cancelar</button>
              <button class="btn btn-primary" (click)="guardarLote()" [disabled]="guardando()">
                {{ guardando() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (modalObjetos()) {
        <div class="modal-overlay" (click)="cerrarModal()">
          <div class="modal modal-grande" (click)="$event.stopPropagation()">
            <h2>Objetos del lote: {{ loteSeleccionado?.nombre }}</h2>

            <div class="objetos-lote">
              <h4>Objetos en el lote ({{ loteSeleccionado?.objetos?.length || 0 }})</h4>
              @if (!loteSeleccionado?.objetos?.length) {
                <p class="sin-objetos">No hay objetos en este lote</p>
              } @else {
                <div class="objetos-lista">
                  @for (objeto of loteSeleccionado?.objetos; track objeto.id) {
                    <div class="objeto-item">
                      <span>{{ objeto.codigoUnico }} - {{ objeto.titulo }}</span>
                      <button class="btn-icon" (click)="quitarDelLote(objeto.id)">❌</button>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="objetos-disponibles">
              <h4>Objetos disponibles</h4>
              <input
                type="text"
                [(ngModel)]="busquedaObjeto"
                placeholder="Buscar objeto..."
                (keyup)="buscarObjetos()"
              >
              <div class="objetos-lista">
                @for (objeto of objetosDisponibles(); track objeto.id) {
                  <div class="objeto-item">
                    <span>{{ objeto.codigoUnico }} - {{ objeto.titulo }}</span>
                    <button class="btn btn-sm" (click)="agregarAlLote(objeto.id)">Agregar</button>
                  </div>
                }
              </div>
            </div>

            <div class="modal-acciones">
              <button class="btn btn-primary" (click)="cerrarModal()">Cerrar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .lotes-container {
      padding: 2rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h1 { margin: 0; }

    .filtros {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .filtros select {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .loading, .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;
      background: white;
      border-radius: 8px;
    }

    .lotes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .lote-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .lote-header {
      display: flex;
      justify-content: space-between;
      padding: 1.5rem;
      background: #f9f9f9;
    }

    .lote-codigo {
      font-size: 0.75rem;
      color: #999;
    }

    .lote-header h3 {
      margin: 0.25rem 0 0;
      font-size: 1.125rem;
    }

    .badges {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .tipo-badge, .estado-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      text-align: center;
    }

    .tipo-subasta { background: #e3f2fd; color: #1976d2; }
    .tipo-donacion { background: #e8f5e9; color: #388e3c; }
    .tipo-reciclaje { background: #fff3e0; color: #f57c00; }
    .tipo-destruccion { background: #ffebee; color: #c62828; }

    .estado-preparacion { background: #fff9c4; color: #f9a825; }
    .estado-publicado { background: #e3f2fd; color: #1976d2; }
    .estado-en_curso { background: #e8f5e9; color: #388e3c; }
    .estado-cerrado { background: #f5f5f5; color: #616161; }

    .lote-body {
      padding: 1.5rem;
    }

    .objetos-preview {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .objeto-thumb {
      width: 50px;
      height: 50px;
      border-radius: 4px;
      background: #f0f0f0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .objeto-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .objeto-thumb.mas {
      background: #667eea;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .lote-info p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
      color: #666;
    }

    .lote-acciones {
      display: flex;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      background: #f9f9f9;
      border-top: 1px solid #eee;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      background: white;
      border: 1px solid #ddd;
    }

    .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; }
    .btn-primary { background: #667eea; color: white; border: none; }
    .btn-outline { background: white; border: 1px solid #ddd; }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      opacity: 0.6;
    }

    .btn-icon:hover { opacity: 1; }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
    }

    .modal-grande {
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal h2 { margin: 0 0 1.5rem; }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-group input, .form-group select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .modal-acciones {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    .objetos-lote, .objetos-disponibles {
      margin-bottom: 1.5rem;
    }

    .objetos-lote h4, .objetos-disponibles h4 {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
    }

    .sin-objetos {
      color: #999;
      padding: 1rem;
      text-align: center;
      background: #f9f9f9;
      border-radius: 4px;
    }

    .objetos-lista {
      max-height: 200px;
      overflow-y: auto;
    }

    .objeto-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      border-bottom: 1px solid #eee;
    }
  `]
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
