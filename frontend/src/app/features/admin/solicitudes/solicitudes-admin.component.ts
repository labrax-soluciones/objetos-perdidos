import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface Solicitud {
  id: number;
  objeto: {
    id: number;
    codigoUnico: string;
    titulo: string;
  };
  ciudadano: {
    id: number;
    nombre: string;
    email: string;
    telefono?: string;
    dni?: string;
  };
  estado: string;
  tipoEntrega: string;
  documentosAdjuntos?: string[];
  motivoRechazo?: string;
  fechaCita?: string;
  createdAt: string;
}

@Component({
  selector: 'app-solicitudes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="solicitudes-container">
      <div class="header">
        <h1>Solicitudes de recuperacion</h1>
      </div>

      <div class="filtros">
        <select [(ngModel)]="filtroEstado" (change)="cargarSolicitudes()">
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="VALIDANDO">En validacion</option>
          <option value="APROBADA">Aprobadas</option>
          <option value="RECHAZADA">Rechazadas</option>
          <option value="ENTREGADA">Entregadas</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading">Cargando solicitudes...</div>
      } @else if (solicitudes().length === 0) {
        <div class="empty-state">
          <p>No hay solicitudes {{ filtroEstado ? 'con este estado' : '' }}</p>
        </div>
      } @else {
        <div class="solicitudes-lista">
          @for (solicitud of solicitudes(); track solicitud.id) {
            <div class="solicitud-card" [class]="'estado-' + solicitud.estado.toLowerCase()">
              <div class="solicitud-header">
                <div class="objeto-info">
                  <span class="codigo">{{ solicitud.objeto.codigoUnico }}</span>
                  <h3>{{ solicitud.objeto.titulo }}</h3>
                </div>
                <span class="estado-badge">{{ solicitud.estado }}</span>
              </div>

              <div class="solicitud-body">
                <div class="ciudadano-info">
                  <h4>Solicitante</h4>
                  <p><strong>{{ solicitud.ciudadano.nombre }}</strong></p>
                  <p>{{ solicitud.ciudadano.email }}</p>
                  @if (solicitud.ciudadano.telefono) {
                    <p>Tel: {{ solicitud.ciudadano.telefono }}</p>
                  }
                  @if (solicitud.ciudadano.dni) {
                    <p>DNI: {{ solicitud.ciudadano.dni }}</p>
                  }
                </div>

                <div class="detalles">
                  <p><strong>Tipo entrega:</strong> {{ solicitud.tipoEntrega === 'PRESENCIAL' ? 'Recogida presencial' : 'Envio a domicilio' }}</p>
                  <p><strong>Fecha solicitud:</strong> {{ solicitud.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                  @if (solicitud.fechaCita) {
                    <p><strong>Cita:</strong> {{ solicitud.fechaCita | date:'dd/MM/yyyy HH:mm' }}</p>
                  }
                  @if (solicitud.motivoRechazo) {
                    <p class="rechazo"><strong>Motivo rechazo:</strong> {{ solicitud.motivoRechazo }}</p>
                  }
                </div>

                @if (solicitud.documentosAdjuntos && solicitud.documentosAdjuntos.length > 0) {
                  <div class="documentos">
                    <h4>Documentos adjuntos</h4>
                    <div class="docs-lista">
                      @for (doc of solicitud.documentosAdjuntos; track doc) {
                        <a [href]="doc" target="_blank" class="doc-link">📄 Ver documento</a>
                      }
                    </div>
                  </div>
                }
              </div>

              <div class="solicitud-acciones">
                @switch (solicitud.estado) {
                  @case ('PENDIENTE') {
                    <button class="btn btn-primary" (click)="abrirValidacion(solicitud)">
                      Iniciar validacion
                    </button>
                    <button class="btn btn-danger" (click)="abrirRechazo(solicitud)">
                      Rechazar
                    </button>
                  }
                  @case ('VALIDANDO') {
                    <button class="btn btn-success" (click)="abrirAprobacion(solicitud)">
                      Aprobar
                    </button>
                    <button class="btn btn-danger" (click)="abrirRechazo(solicitud)">
                      Rechazar
                    </button>
                  }
                  @case ('APROBADA') {
                    <button class="btn btn-primary" (click)="abrirEntrega(solicitud)">
                      Marcar como entregado
                    </button>
                  }
                }
              </div>
            </div>
          }
        </div>
      }

      @if (modalValidacion()) {
        <div class="modal-overlay" (click)="cerrarModales()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>Iniciar validacion</h2>
            <p>Se marcara la solicitud como "En validacion".</p>
            <div class="modal-acciones">
              <button class="btn btn-outline" (click)="cerrarModales()">Cancelar</button>
              <button class="btn btn-primary" (click)="validar()" [disabled]="procesando()">
                {{ procesando() ? 'Procesando...' : 'Confirmar' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (modalAprobacion()) {
        <div class="modal-overlay" (click)="cerrarModales()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>Aprobar solicitud</h2>
            <div class="form-group">
              <label>Fecha y hora de cita (opcional)</label>
              <input type="datetime-local" [(ngModel)]="fechaCita">
            </div>
            <div class="modal-acciones">
              <button class="btn btn-outline" (click)="cerrarModales()">Cancelar</button>
              <button class="btn btn-success" (click)="aprobar()" [disabled]="procesando()">
                {{ procesando() ? 'Procesando...' : 'Aprobar' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (modalRechazo()) {
        <div class="modal-overlay" (click)="cerrarModales()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>Rechazar solicitud</h2>
            <div class="form-group">
              <label>Motivo del rechazo *</label>
              <textarea
                [(ngModel)]="motivoRechazo"
                rows="4"
                placeholder="Explica el motivo del rechazo..."
              ></textarea>
            </div>
            <div class="modal-acciones">
              <button class="btn btn-outline" (click)="cerrarModales()">Cancelar</button>
              <button
                class="btn btn-danger"
                (click)="rechazar()"
                [disabled]="procesando() || !motivoRechazo"
              >
                {{ procesando() ? 'Procesando...' : 'Rechazar' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (modalEntrega()) {
        <div class="modal-overlay" (click)="cerrarModales()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>Confirmar entrega</h2>
            <p>Confirma que el objeto ha sido entregado al ciudadano.</p>
            <div class="form-group">
              <label>Observaciones (opcional)</label>
              <textarea
                [(ngModel)]="observacionesEntrega"
                rows="3"
                placeholder="Notas adicionales..."
              ></textarea>
            </div>
            <div class="modal-acciones">
              <button class="btn btn-outline" (click)="cerrarModales()">Cancelar</button>
              <button class="btn btn-primary" (click)="entregar()" [disabled]="procesando()">
                {{ procesando() ? 'Procesando...' : 'Confirmar entrega' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .solicitudes-container {
      padding: 2rem;
    }

    .header {
      margin-bottom: 2rem;
    }

    h1 {
      margin: 0;
    }

    .filtros {
      margin-bottom: 1.5rem;
    }

    .filtros select {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .loading, .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;
      background: white;
      border-radius: 8px;
    }

    .solicitudes-lista {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .solicitud-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .solicitud-card.estado-pendiente {
      border-left: 4px solid #ff9800;
    }

    .solicitud-card.estado-validando {
      border-left: 4px solid #2196f3;
    }

    .solicitud-card.estado-aprobada {
      border-left: 4px solid #4caf50;
    }

    .solicitud-card.estado-rechazada {
      border-left: 4px solid #f44336;
    }

    .solicitud-card.estado-entregada {
      border-left: 4px solid #9e9e9e;
    }

    .solicitud-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.5rem;
      background: #f9f9f9;
    }

    .objeto-info .codigo {
      font-size: 0.75rem;
      color: #999;
    }

    .objeto-info h3 {
      margin: 0.25rem 0 0;
    }

    .estado-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #e0e0e0;
    }

    .estado-pendiente .estado-badge { background: #fff3e0; color: #f57c00; }
    .estado-validando .estado-badge { background: #e3f2fd; color: #1976d2; }
    .estado-aprobada .estado-badge { background: #e8f5e9; color: #388e3c; }
    .estado-rechazada .estado-badge { background: #ffebee; color: #c62828; }
    .estado-entregada .estado-badge { background: #f5f5f5; color: #616161; }

    .solicitud-body {
      padding: 1.5rem;
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 2rem;
    }

    .ciudadano-info h4, .documentos h4 {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
      color: #666;
    }

    .ciudadano-info p, .detalles p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
    }

    .rechazo {
      color: #c62828;
    }

    .documentos {
      grid-column: 1 / -1;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .docs-lista {
      display: flex;
      gap: 1rem;
    }

    .doc-link {
      color: #667eea;
      text-decoration: none;
      font-size: 0.875rem;
    }

    .solicitud-acciones {
      display: flex;
      gap: 1rem;
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
    }

    .btn-primary { background: #667eea; color: white; }
    .btn-success { background: #4caf50; color: white; }
    .btn-danger { background: #f44336; color: white; }
    .btn-outline { background: white; border: 1px solid #ddd; color: #666; }

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
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
      max-width: 500px;
      width: 90%;
    }

    .modal h2 {
      margin: 0 0 1rem;
    }

    .form-group {
      margin: 1rem 0;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-group input, .form-group textarea {
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

    @media (max-width: 768px) {
      .solicitud-body {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SolicitudesAdminComponent implements OnInit {
  private api = inject(ApiService);

  solicitudes = signal<Solicitud[]>([]);
  loading = signal(true);
  filtroEstado = '';

  solicitudActiva: Solicitud | null = null;
  modalValidacion = signal(false);
  modalAprobacion = signal(false);
  modalRechazo = signal(false);
  modalEntrega = signal(false);
  procesando = signal(false);

  fechaCita = '';
  motivoRechazo = '';
  observacionesEntrega = '';

  ngOnInit() {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.loading.set(true);
    const params = this.filtroEstado ? `?estado=${this.filtroEstado}` : '';

    this.api.get<Solicitud[]>(`/admin/solicitudes${params}`).subscribe({
      next: (solicitudes) => {
        this.solicitudes.set(solicitudes);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  abrirValidacion(solicitud: Solicitud) {
    this.solicitudActiva = solicitud;
    this.modalValidacion.set(true);
  }

  abrirAprobacion(solicitud: Solicitud) {
    this.solicitudActiva = solicitud;
    this.fechaCita = '';
    this.modalAprobacion.set(true);
  }

  abrirRechazo(solicitud: Solicitud) {
    this.solicitudActiva = solicitud;
    this.motivoRechazo = '';
    this.modalRechazo.set(true);
  }

  abrirEntrega(solicitud: Solicitud) {
    this.solicitudActiva = solicitud;
    this.observacionesEntrega = '';
    this.modalEntrega.set(true);
  }

  cerrarModales() {
    this.modalValidacion.set(false);
    this.modalAprobacion.set(false);
    this.modalRechazo.set(false);
    this.modalEntrega.set(false);
    this.solicitudActiva = null;
  }

  validar() {
    if (!this.solicitudActiva) return;
    this.procesando.set(true);

    this.api.put(`/admin/solicitudes/${this.solicitudActiva.id}/validar`, {}).subscribe({
      next: () => {
        this.procesando.set(false);
        this.cerrarModales();
        this.cargarSolicitudes();
      },
      error: () => {
        this.procesando.set(false);
      }
    });
  }

  aprobar() {
    if (!this.solicitudActiva) return;
    this.procesando.set(true);

    const data: any = {};
    if (this.fechaCita) data.fechaCita = this.fechaCita;

    this.api.put(`/admin/solicitudes/${this.solicitudActiva.id}/validar`, data).subscribe({
      next: () => {
        this.procesando.set(false);
        this.cerrarModales();
        this.cargarSolicitudes();
      },
      error: () => {
        this.procesando.set(false);
      }
    });
  }

  rechazar() {
    if (!this.solicitudActiva || !this.motivoRechazo) return;
    this.procesando.set(true);

    this.api.put(`/admin/solicitudes/${this.solicitudActiva.id}/rechazar`, {
      motivo: this.motivoRechazo
    }).subscribe({
      next: () => {
        this.procesando.set(false);
        this.cerrarModales();
        this.cargarSolicitudes();
      },
      error: () => {
        this.procesando.set(false);
      }
    });
  }

  entregar() {
    if (!this.solicitudActiva) return;
    this.procesando.set(true);

    this.api.put(`/admin/solicitudes/${this.solicitudActiva.id}/entregar`, {
      observaciones: this.observacionesEntrega
    }).subscribe({
      next: () => {
        this.procesando.set(false);
        this.cerrarModales();
        this.cargarSolicitudes();
      },
      error: () => {
        this.procesando.set(false);
      }
    });
  }
}
