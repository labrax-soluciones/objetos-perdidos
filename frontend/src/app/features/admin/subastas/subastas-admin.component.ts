import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface Subasta {
  id: number;
  lote: {
    codigo: string;
    nombre: string;
    objetos: any[];
  };
  precioSalida: number;
  precioActual: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  ganador?: { nombre: string; email: string };
  totalPujas: number;
}

@Component({
  selector: 'app-subastas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="subastas-container">
      <div class="header">
        <h1>Gestion de subastas</h1>
      </div>

      <div class="filtros">
        <select [(ngModel)]="filtroEstado" (change)="cargarSubastas()">
          <option value="">Todos los estados</option>
          <option value="PROGRAMADA">Programadas</option>
          <option value="ACTIVA">Activas</option>
          <option value="CERRADA">Cerradas</option>
          <option value="ADJUDICADA">Adjudicadas</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading">Cargando subastas...</div>
      } @else if (subastas().length === 0) {
        <div class="empty-state">
          <p>No hay subastas {{ filtroEstado ? 'con este estado' : '' }}</p>
          <p class="hint">Las subastas se crean desde la gestion de lotes</p>
        </div>
      } @else {
        <div class="tabla-container">
          <table class="tabla">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Estado</th>
                <th>Precio salida</th>
                <th>Precio actual</th>
                <th>Pujas</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Ganador</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (subasta of subastas(); track subasta.id) {
                <tr>
                  <td>
                    <div class="lote-cell">
                      <strong>{{ subasta.lote.codigo }}</strong>
                      <span>{{ subasta.lote.nombre }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="estado-badge" [class]="'estado-' + subasta.estado.toLowerCase()">
                      {{ subasta.estado }}
                    </span>
                  </td>
                  <td>{{ subasta.precioSalida | currency:'EUR' }}</td>
                  <td class="precio-actual">{{ subasta.precioActual | currency:'EUR' }}</td>
                  <td>{{ subasta.totalPujas }}</td>
                  <td>{{ subasta.fechaInicio | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>{{ subasta.fechaFin | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>
                    @if (subasta.ganador) {
                      <div class="ganador-cell">
                        <span>{{ subasta.ganador.nombre }}</span>
                        <small>{{ subasta.ganador.email }}</small>
                      </div>
                    } @else {
                      <span class="sin-ganador">-</span>
                    }
                  </td>
                  <td>
                    <div class="acciones">
                      @if (subasta.estado === 'PROGRAMADA') {
                        <button class="btn btn-sm" (click)="editarFechas(subasta)">
                          Editar fechas
                        </button>
                      }
                      @if (subasta.estado === 'ACTIVA') {
                        <button class="btn btn-sm btn-danger" (click)="cerrarSubasta(subasta)">
                          Cerrar
                        </button>
                      }
                      @if (subasta.estado === 'CERRADA' && subasta.totalPujas > 0) {
                        <button class="btn btn-sm btn-primary" (click)="adjudicar(subasta)">
                          Adjudicar
                        </button>
                      }
                      <button class="btn-icon" (click)="verDetalles(subasta)">👁️</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (modalDetalle()) {
        <div class="modal-overlay" (click)="cerrarModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>Detalle de subasta</h2>

            @if (subastaDetalle()) {
              <div class="detalle-info">
                <p><strong>Lote:</strong> {{ subastaDetalle()!.lote.codigo }} - {{ subastaDetalle()!.lote.nombre }}</p>
                <p><strong>Estado:</strong> {{ subastaDetalle()!.estado }}</p>
                <p><strong>Precio salida:</strong> {{ subastaDetalle()!.precioSalida | currency:'EUR' }}</p>
                <p><strong>Precio actual:</strong> {{ subastaDetalle()!.precioActual | currency:'EUR' }}</p>
                <p><strong>Total pujas:</strong> {{ subastaDetalle()!.totalPujas }}</p>
              </div>

              <h3>Historial de pujas</h3>
              @if (pujas().length === 0) {
                <p class="sin-pujas">No hay pujas</p>
              } @else {
                <div class="pujas-lista">
                  @for (puja of pujas(); track puja.id; let i = $index) {
                    <div class="puja-item" [class.ganadora]="i === 0">
                      <div class="puja-info">
                        <span class="puja-usuario">{{ puja.usuario.nombre }}</span>
                        <span class="puja-email">{{ puja.usuario.email }}</span>
                        <span class="puja-fecha">{{ puja.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</span>
                      </div>
                      <span class="puja-cantidad">{{ puja.cantidad | currency:'EUR' }}</span>
                    </div>
                  }
                </div>
              }
            }

            <div class="modal-acciones">
              <button class="btn btn-primary" (click)="cerrarModal()">Cerrar</button>
            </div>
          </div>
        </div>
      }

      @if (modalFechas()) {
        <div class="modal-overlay" (click)="cerrarModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>Editar fechas</h2>

            <div class="form-group">
              <label>Fecha inicio</label>
              <input type="datetime-local" [(ngModel)]="formFechas.fechaInicio">
            </div>

            <div class="form-group">
              <label>Fecha fin</label>
              <input type="datetime-local" [(ngModel)]="formFechas.fechaFin">
            </div>

            <div class="modal-acciones">
              <button class="btn btn-outline" (click)="cerrarModal()">Cancelar</button>
              <button class="btn btn-primary" (click)="guardarFechas()" [disabled]="guardando()">
                {{ guardando() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .subastas-container {
      padding: 2rem;
    }

    .header {
      margin-bottom: 2rem;
    }

    h1 { margin: 0; }

    .filtros {
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

    .hint {
      font-size: 0.875rem;
      color: #999;
    }

    .tabla-container {
      background: white;
      border-radius: 8px;
      overflow-x: auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .tabla {
      width: 100%;
      border-collapse: collapse;
    }

    .tabla th, .tabla td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .tabla th {
      background: #f9f9f9;
      font-weight: 600;
      font-size: 0.875rem;
      color: #666;
    }

    .lote-cell {
      display: flex;
      flex-direction: column;
    }

    .lote-cell span {
      font-size: 0.875rem;
      color: #666;
    }

    .estado-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .estado-programada { background: #fff9c4; color: #f9a825; }
    .estado-activa { background: #e8f5e9; color: #388e3c; }
    .estado-cerrada { background: #f5f5f5; color: #616161; }
    .estado-adjudicada { background: #e3f2fd; color: #1976d2; }

    .precio-actual {
      font-weight: 600;
      color: #667eea;
    }

    .ganador-cell {
      display: flex;
      flex-direction: column;
    }

    .ganador-cell small {
      color: #999;
      font-size: 0.75rem;
    }

    .sin-ganador {
      color: #999;
    }

    .acciones {
      display: flex;
      gap: 0.5rem;
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
    .btn-danger { background: #f44336; color: white; border: none; }
    .btn-outline { background: white; border: 1px solid #ddd; }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
    }

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
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal h2 { margin: 0 0 1.5rem; }
    .modal h3 { margin: 1.5rem 0 1rem; font-size: 1rem; }

    .detalle-info p {
      margin: 0.5rem 0;
    }

    .sin-pujas {
      color: #999;
      text-align: center;
      padding: 1rem;
    }

    .pujas-lista {
      max-height: 300px;
      overflow-y: auto;
    }

    .puja-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem;
      border-bottom: 1px solid #eee;
    }

    .puja-item.ganadora {
      background: #e8f5e9;
    }

    .puja-info {
      display: flex;
      flex-direction: column;
    }

    .puja-usuario { font-weight: 500; }
    .puja-email { font-size: 0.75rem; color: #666; }
    .puja-fecha { font-size: 0.75rem; color: #999; }

    .puja-cantidad {
      font-weight: 600;
      color: #667eea;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-group input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
    }

    .modal-acciones {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }
  `]
})
export class SubastasAdminComponent implements OnInit {
  private api = inject(ApiService);

  subastas = signal<Subasta[]>([]);
  loading = signal(true);
  guardando = signal(false);
  filtroEstado = '';

  modalDetalle = signal(false);
  modalFechas = signal(false);
  subastaDetalle = signal<Subasta | null>(null);
  subastaEditar: Subasta | null = null;
  pujas = signal<any[]>([]);

  formFechas = {
    fechaInicio: '',
    fechaFin: ''
  };

  ngOnInit() {
    this.cargarSubastas();
  }

  cargarSubastas() {
    this.loading.set(true);
    const params = this.filtroEstado ? `?estado=${this.filtroEstado}` : '';

    this.api.get<Subasta[]>(`/admin/subastas${params}`).subscribe({
      next: (data) => {
        this.subastas.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  verDetalles(subasta: Subasta) {
    this.subastaDetalle.set(subasta);
    this.api.get<any[]>(`/admin/subastas/${subasta.id}/pujas`).subscribe({
      next: (pujas) => this.pujas.set(pujas)
    });
    this.modalDetalle.set(true);
  }

  editarFechas(subasta: Subasta) {
    this.subastaEditar = subasta;
    this.formFechas = {
      fechaInicio: subasta.fechaInicio.slice(0, 16),
      fechaFin: subasta.fechaFin.slice(0, 16)
    };
    this.modalFechas.set(true);
  }

  cerrarModal() {
    this.modalDetalle.set(false);
    this.modalFechas.set(false);
    this.subastaDetalle.set(null);
    this.subastaEditar = null;
    this.pujas.set([]);
  }

  guardarFechas() {
    if (!this.subastaEditar) return;
    this.guardando.set(true);

    this.api.put(`/admin/subastas/${this.subastaEditar.id}`, this.formFechas).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarSubastas();
      },
      error: () => this.guardando.set(false)
    });
  }

  cerrarSubasta(subasta: Subasta) {
    if (!confirm('¿Cerrar esta subasta? No se podran realizar mas pujas.')) return;

    this.api.post(`/admin/subastas/${subasta.id}/cerrar`, {}).subscribe({
      next: () => this.cargarSubastas()
    });
  }

  adjudicar(subasta: Subasta) {
    if (!confirm('¿Adjudicar esta subasta al mejor postor?')) return;

    this.api.post(`/admin/subastas/${subasta.id}/adjudicar`, {}).subscribe({
      next: () => this.cargarSubastas()
    });
  }
}
