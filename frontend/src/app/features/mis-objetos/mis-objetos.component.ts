import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ObjetoService } from '../../core/services/objeto.service';
import { Objeto } from '../../core/models';

@Component({
  selector: 'app-mis-objetos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mis-objetos-container">
      <div class="header">
        <h1>Mis objetos</h1>
        <a routerLink="/reportar-perdido" class="btn btn-primary">
          Reportar objeto perdido
        </a>
      </div>

      <div class="tabs">
        <button
          [class.active]="tabActiva() === 'perdidos'"
          (click)="cambiarTab('perdidos')"
        >
          Objetos perdidos
        </button>
        <button
          [class.active]="tabActiva() === 'solicitudes'"
          (click)="cambiarTab('solicitudes')"
        >
          Mis solicitudes
        </button>
      </div>

      @if (loading()) {
        <div class="loading">Cargando...</div>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else {
        @if (tabActiva() === 'perdidos') {
          @if (objetosPerdidos().length === 0) {
            <div class="empty-state">
              <p>No has reportado ningun objeto perdido</p>
              <a routerLink="/reportar-perdido" class="btn btn-outline">
                Reportar objeto perdido
              </a>
            </div>
          } @else {
            <div class="objetos-list">
              @for (objeto of objetosPerdidos(); track objeto.id) {
                <div class="objeto-card">
                  <div class="objeto-imagen">
                    @if (objeto.fotos && objeto.fotos.length > 0) {
                      <img [src]="objeto.fotos[0].thumbnailUrl || objeto.fotos[0].url" [alt]="objeto.titulo">
                    } @else {
                      <div class="no-imagen">Sin imagen</div>
                    }
                  </div>
                  <div class="objeto-info">
                    <h3>{{ objeto.titulo }}</h3>
                    <p class="descripcion">{{ objeto.descripcion }}</p>
                    <div class="meta">
                      <span class="fecha">Perdido: {{ objeto.fechaHallazgo | date:'dd/MM/yyyy' }}</span>
                      <span class="estado" [class]="'estado-' + objeto.estado.toLowerCase()">
                        {{ getEstadoLabel(objeto.estado) }}
                      </span>
                    </div>
                    @if (objeto.coincidencias && objeto.coincidencias > 0) {
                      <div class="coincidencias">
                        {{ objeto.coincidencias }} posible(s) coincidencia(s)
                      </div>
                    }
                  </div>
                  <div class="objeto-acciones">
                    <a [routerLink]="['/objetos', objeto.id]" class="btn btn-sm">Ver detalle</a>
                  </div>
                </div>
              }
            </div>
          }
        } @else {
          @if (solicitudes().length === 0) {
            <div class="empty-state">
              <p>No tienes solicitudes de recuperacion</p>
              <a routerLink="/galeria" class="btn btn-outline">
                Buscar objetos
              </a>
            </div>
          } @else {
            <div class="solicitudes-list">
              @for (solicitud of solicitudes(); track solicitud.id) {
                <div class="solicitud-card">
                  <div class="solicitud-objeto">
                    @if (solicitud.objeto) {
                      <div class="objeto-mini">
                        @if (solicitud.objeto.fotos && solicitud.objeto.fotos.length > 0) {
                          <img [src]="solicitud.objeto.fotos[0].thumbnailUrl" [alt]="solicitud.objeto.titulo">
                        }
                        <div>
                          <h4>{{ solicitud.objeto.titulo }}</h4>
                          <span class="codigo">{{ solicitud.objeto.codigoUnico }}</span>
                        </div>
                      </div>
                    }
                  </div>
                  <div class="solicitud-info">
                    <span class="estado-solicitud" [class]="'estado-' + solicitud.estado.toLowerCase()">
                      {{ getSolicitudEstadoLabel(solicitud.estado) }}
                    </span>
                    <span class="fecha">Solicitado: {{ solicitud.createdAt | date:'dd/MM/yyyy' }}</span>
                    @if (solicitud.fechaCita) {
                      <span class="cita">Cita: {{ solicitud.fechaCita | date:'dd/MM/yyyy HH:mm' }}</span>
                    }
                    @if (solicitud.motivoRechazo) {
                      <p class="rechazo">Motivo: {{ solicitud.motivoRechazo }}</p>
                    }
                  </div>
                </div>
              }
            </div>
          }
        }
      }

      @if (modalSolicitud()) {
        <div class="modal-overlay" (click)="cerrarModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>Solicitar recuperacion</h2>
            <p>Vas a solicitar la recuperacion del objeto:</p>
            <strong>{{ objetoSolicitar()?.titulo }}</strong>

            <div class="form-group">
              <label>Documentos que acrediten la propiedad (opcional)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                (change)="onDocumentosSelected($event)"
              >
            </div>

            <div class="form-group">
              <label>Tipo de entrega</label>
              <select [(ngModel)]="tipoEntrega" name="tipoEntrega">
                <option value="PRESENCIAL">Recogida presencial</option>
                <option value="ENVIO">Envio a domicilio</option>
              </select>
            </div>

            <div class="modal-actions">
              <button class="btn btn-outline" (click)="cerrarModal()">Cancelar</button>
              <button class="btn btn-primary" (click)="enviarSolicitud()" [disabled]="enviandoSolicitud()">
                {{ enviandoSolicitud() ? 'Enviando...' : 'Enviar solicitud' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .mis-objetos-container {
      max-width: 900px;
      margin: 0 auto;
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

    .tabs {
      display: flex;
      gap: 0;
      margin-bottom: 2rem;
      border-bottom: 2px solid #eee;
    }

    .tabs button {
      padding: 1rem 2rem;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 1rem;
      color: #666;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
    }

    .tabs button.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }

    .loading, .error {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .error {
      color: #c00;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 1.5rem;
    }

    .objetos-list, .solicitudes-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .objeto-card {
      display: flex;
      gap: 1.5rem;
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .objeto-imagen {
      width: 120px;
      height: 120px;
      flex-shrink: 0;
      border-radius: 8px;
      overflow: hidden;
      background: #f0f0f0;
    }

    .objeto-imagen img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-imagen {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 0.875rem;
    }

    .objeto-info {
      flex: 1;
    }

    .objeto-info h3 {
      margin: 0 0 0.5rem;
    }

    .descripcion {
      color: #666;
      margin: 0 0 0.75rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .meta {
      display: flex;
      gap: 1rem;
      align-items: center;
      font-size: 0.875rem;
    }

    .fecha {
      color: #999;
    }

    .estado {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .estado-registrado { background: #e3f2fd; color: #1976d2; }
    .estado-en_almacen { background: #fff3e0; color: #f57c00; }
    .estado-reclamado { background: #fff9c4; color: #f9a825; }
    .estado-entregado { background: #e8f5e9; color: #388e3c; }

    .coincidencias {
      margin-top: 0.75rem;
      padding: 0.5rem;
      background: #e8f5e9;
      color: #2e7d32;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .objeto-acciones {
      display: flex;
      align-items: center;
    }

    .solicitud-card {
      display: flex;
      gap: 1.5rem;
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .objeto-mini {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .objeto-mini img {
      width: 60px;
      height: 60px;
      border-radius: 4px;
      object-fit: cover;
    }

    .objeto-mini h4 {
      margin: 0 0 0.25rem;
    }

    .codigo {
      font-size: 0.75rem;
      color: #999;
    }

    .solicitud-info {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }

    .estado-solicitud {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .estado-pendiente { background: #fff3e0; color: #f57c00; }
    .estado-validando { background: #e3f2fd; color: #1976d2; }
    .estado-aprobada { background: #e8f5e9; color: #388e3c; }
    .estado-rechazada { background: #ffebee; color: #c62828; }
    .estado-entregada { background: #e8f5e9; color: #2e7d32; }

    .cita {
      color: #667eea;
      font-weight: 500;
    }

    .rechazo {
      width: 100%;
      margin: 0;
      color: #c62828;
      font-size: 0.875rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-outline {
      background: white;
      border: 1px solid #667eea;
      color: #667eea;
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
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
    }

    .modal h2 {
      margin: 0 0 1rem;
    }

    .form-group {
      margin: 1.5rem 0;
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
      border-radius: 4px;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    @media (max-width: 600px) {
      .header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .objeto-card {
        flex-direction: column;
      }

      .objeto-imagen {
        width: 100%;
        height: 200px;
      }

      .tabs button {
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
      }
    }
  `]
})
export class MisObjetosComponent implements OnInit {
  private objetoService = inject(ObjetoService);
  private route = inject(ActivatedRoute);

  tabActiva = signal<'perdidos' | 'solicitudes'>('perdidos');
  objetosPerdidos = signal<Objeto[]>([]);
  solicitudes = signal<any[]>([]);
  loading = signal(true);
  error = signal('');

  modalSolicitud = signal(false);
  objetoSolicitar = signal<Objeto | null>(null);
  documentos: File[] = [];
  tipoEntrega = 'PRESENCIAL';
  enviandoSolicitud = signal(false);

  ngOnInit() {
    this.loadData();

    // Check if there's a request to open solicitud modal
    const solicitar = this.route.snapshot.queryParams['solicitar'];
    if (solicitar) {
      this.abrirModalSolicitud(+solicitar);
    }
  }

  private loadData() {
    this.loading.set(true);
    this.objetoService.getMisObjetos().subscribe({
      next: (data) => {
        this.objetosPerdidos.set(data.perdidos || []);
        this.solicitudes.set(data.solicitudes || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Error al cargar los datos');
      }
    });
  }

  cambiarTab(tab: 'perdidos' | 'solicitudes') {
    this.tabActiva.set(tab);
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      'REGISTRADO': 'Registrado',
      'EN_ALMACEN': 'En almacen',
      'RECLAMADO': 'Reclamado',
      'ENTREGADO': 'Entregado',
      'SUBASTA': 'En subasta',
      'DONADO': 'Donado',
      'RECICLADO': 'Reciclado',
      'DESTRUIDO': 'Destruido'
    };
    return labels[estado] || estado;
  }

  getSolicitudEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      'PENDIENTE': 'Pendiente',
      'VALIDANDO': 'En validacion',
      'APROBADA': 'Aprobada',
      'RECHAZADA': 'Rechazada',
      'ENTREGADA': 'Entregada'
    };
    return labels[estado] || estado;
  }

  abrirModalSolicitud(objetoId: number) {
    this.objetoService.getObjeto(objetoId).subscribe({
      next: (objeto) => {
        this.objetoSolicitar.set(objeto);
        this.modalSolicitud.set(true);
      },
      error: (err) => {
        console.error('Error loading object:', err);
      }
    });
  }

  cerrarModal() {
    this.modalSolicitud.set(false);
    this.objetoSolicitar.set(null);
    this.documentos = [];
    this.tipoEntrega = 'PRESENCIAL';
  }

  onDocumentosSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.documentos = Array.from(input.files);
    }
  }

  enviarSolicitud() {
    const objeto = this.objetoSolicitar();
    if (!objeto) return;

    this.enviandoSolicitud.set(true);

    const formData = new FormData();
    formData.append('tipoEntrega', this.tipoEntrega);
    this.documentos.forEach((doc, i) => {
      formData.append(`documentos[${i}]`, doc);
    });

    this.objetoService.solicitarRecuperacion(objeto.id, formData).subscribe({
      next: () => {
        this.enviandoSolicitud.set(false);
        this.cerrarModal();
        this.loadData();
      },
      error: (err) => {
        this.enviandoSolicitud.set(false);
        alert(err.message || 'Error al enviar la solicitud');
      }
    });
  }
}
