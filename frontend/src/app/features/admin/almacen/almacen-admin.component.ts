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
    <div class="almacen-container">
      <div class="header">
        <h1>Gestion de almacen</h1>
        <button class="btn btn-primary" (click)="abrirModalAlmacen()">
          + Nuevo almacen
        </button>
      </div>

      @if (loading()) {
        <div class="loading">Cargando almacenes...</div>
      } @else {
        <div class="almacenes-grid">
          @for (almacen of almacenes(); track almacen.id) {
            <div class="almacen-card" [class.inactivo]="!almacen.activo">
              <div class="almacen-header">
                <div>
                  <h2>{{ almacen.nombre }}</h2>
                  <p class="direccion">{{ almacen.direccion }}</p>
                </div>
                <div class="almacen-acciones">
                  <button class="btn-icon" (click)="editarAlmacen(almacen)" title="Editar">
                    ✏️
                  </button>
                </div>
              </div>

              <div class="ubicaciones-section">
                <div class="ubicaciones-header">
                  <h3>Ubicaciones</h3>
                  <button class="btn btn-sm" (click)="abrirModalUbicacion(almacen)">
                    + Anadir
                  </button>
                </div>

                @if (almacen.ubicaciones.length === 0) {
                  <p class="sin-ubicaciones">No hay ubicaciones configuradas</p>
                } @else {
                  <div class="ubicaciones-mapa">
                    @for (ubicacion of almacen.ubicaciones; track ubicacion.id) {
                      <div class="ubicacion-item" [class]="'tipo-' + ubicacion.tipo.toLowerCase()">
                        <div class="ubicacion-info">
                          <span class="ubicacion-codigo">{{ ubicacion.codigo }}</span>
                          <span class="ubicacion-tipo">{{ ubicacion.tipo }}</span>
                        </div>
                        <div class="ocupacion">
                          <div class="ocupacion-barra">
                            <div
                              class="ocupacion-fill"
                              [style.width.%]="(ubicacion.ocupacionActual / ubicacion.capacidad) * 100"
                              [class.lleno]="ubicacion.ocupacionActual >= ubicacion.capacidad"
                            ></div>
                          </div>
                          <span class="ocupacion-texto">
                            {{ ubicacion.ocupacionActual }}/{{ ubicacion.capacidad }}
                          </span>
                        </div>
                        <button class="btn-icon eliminar" (click)="eliminarUbicacion(ubicacion.id)" title="Eliminar">
                          🗑️
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="almacen-stats">
                <div class="stat">
                  <span class="stat-valor">{{ getTotalUbicaciones(almacen) }}</span>
                  <span class="stat-label">Ubicaciones</span>
                </div>
                <div class="stat">
                  <span class="stat-valor">{{ getOcupacionTotal(almacen) }}</span>
                  <span class="stat-label">Objetos</span>
                </div>
                <div class="stat">
                  <span class="stat-valor">{{ getCapacidadTotal(almacen) }}</span>
                  <span class="stat-label">Capacidad</span>
                </div>
              </div>
            </div>
          }
        </div>

        @if (almacenes().length === 0) {
          <div class="empty-state">
            <p>No hay almacenes configurados</p>
            <button class="btn btn-primary" (click)="abrirModalAlmacen()">
              Crear primer almacen
            </button>
          </div>
        }
      }

      @if (modalAlmacen()) {
        <div class="modal-overlay" (click)="cerrarModales()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>{{ almacenEditar ? 'Editar' : 'Nuevo' }} almacen</h2>

            <div class="form-group">
              <label>Nombre *</label>
              <input type="text" [(ngModel)]="formAlmacen.nombre" placeholder="Nombre del almacen">
            </div>

            <div class="form-group">
              <label>Direccion</label>
              <input type="text" [(ngModel)]="formAlmacen.direccion" placeholder="Direccion">
            </div>

            <div class="form-group checkbox">
              <label>
                <input type="checkbox" [(ngModel)]="formAlmacen.activo">
                Almacen activo
              </label>
            </div>

            <div class="modal-acciones">
              <button class="btn btn-outline" (click)="cerrarModales()">Cancelar</button>
              <button class="btn btn-primary" (click)="guardarAlmacen()" [disabled]="guardando()">
                {{ guardando() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (modalUbicacion()) {
        <div class="modal-overlay" (click)="cerrarModales()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>Nueva ubicacion</h2>
            <p class="modal-subtitulo">Almacen: {{ almacenSeleccionado?.nombre }}</p>

            <div class="form-group">
              <label>Codigo *</label>
              <input
                type="text"
                [(ngModel)]="formUbicacion.codigo"
                placeholder="Ej: E1-B3-C2"
              >
              <small>Ejemplo: E1 (Estanteria 1), E1-B3 (Balda 3), E1-B3-C2 (Casillero 2)</small>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Tipo *</label>
                <select [(ngModel)]="formUbicacion.tipo">
                  <option value="ESTANTERIA">Estanteria</option>
                  <option value="BALDA">Balda</option>
                  <option value="CASILLERO">Casillero</option>
                  <option value="CAJA">Caja</option>
                </select>
              </div>

              <div class="form-group">
                <label>Capacidad *</label>
                <input type="number" [(ngModel)]="formUbicacion.capacidad" min="1">
              </div>
            </div>

            <div class="modal-acciones">
              <button class="btn btn-outline" (click)="cerrarModales()">Cancelar</button>
              <button class="btn btn-primary" (click)="guardarUbicacion()" [disabled]="guardando()">
                {{ guardando() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .almacen-container {
      padding: 2rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h1 {
      margin: 0;
    }

    .loading, .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;
      background: white;
      border-radius: 8px;
    }

    .almacenes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .almacen-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .almacen-card.inactivo {
      opacity: 0.6;
    }

    .almacen-header {
      display: flex;
      justify-content: space-between;
      padding: 1.5rem;
      background: #f9f9f9;
    }

    .almacen-header h2 {
      margin: 0 0 0.25rem;
      font-size: 1.25rem;
    }

    .direccion {
      margin: 0;
      color: #666;
      font-size: 0.875rem;
    }

    .almacen-acciones {
      display: flex;
      gap: 0.5rem;
    }

    .ubicaciones-section {
      padding: 1.5rem;
    }

    .ubicaciones-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .ubicaciones-header h3 {
      margin: 0;
      font-size: 1rem;
    }

    .sin-ubicaciones {
      text-align: center;
      padding: 2rem;
      color: #999;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .ubicaciones-mapa {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .ubicacion-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: #f9f9f9;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .ubicacion-item.tipo-estanteria { border-color: #667eea; }
    .ubicacion-item.tipo-balda { border-color: #4caf50; }
    .ubicacion-item.tipo-casillero { border-color: #ff9800; }
    .ubicacion-item.tipo-caja { border-color: #9c27b0; }

    .ubicacion-info {
      flex: 1;
    }

    .ubicacion-codigo {
      font-weight: 600;
      font-family: monospace;
    }

    .ubicacion-tipo {
      font-size: 0.75rem;
      color: #999;
      margin-left: 0.5rem;
    }

    .ocupacion {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .ocupacion-barra {
      width: 80px;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .ocupacion-fill {
      height: 100%;
      background: #4caf50;
      transition: width 0.3s;
    }

    .ocupacion-fill.lleno {
      background: #f44336;
    }

    .ocupacion-texto {
      font-size: 0.75rem;
      color: #666;
      min-width: 40px;
    }

    .almacen-stats {
      display: flex;
      border-top: 1px solid #eee;
    }

    .stat {
      flex: 1;
      text-align: center;
      padding: 1rem;
    }

    .stat:not(:last-child) {
      border-right: 1px solid #eee;
    }

    .stat-valor {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #667eea;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #999;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    .btn-primary { background: #667eea; color: white; }
    .btn-outline { background: white; border: 1px solid #ddd; color: #666; }

    .btn-icon {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
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

    .modal h2 {
      margin: 0 0 0.5rem;
    }

    .modal-subtitulo {
      color: #666;
      margin: 0 0 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-group.checkbox label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: normal;
    }

    .form-group input[type="text"],
    .form-group input[type="number"],
    .form-group select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
    }

    .form-group small {
      display: block;
      margin-top: 0.25rem;
      color: #999;
      font-size: 0.75rem;
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

    @media (max-width: 600px) {
      .almacenes-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
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
