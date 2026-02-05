import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface Objeto {
  id: number;
  codigoUnico: string;
  titulo: string;
  descripcion?: string;
  tipo: string;
  estado: string;
  categoria?: { id: number; nombre: string };
  fotoPrincipal?: { url: string; thumbnailUrl: string };
  fechaHallazgo?: string;
  direccionHallazgo?: string;
  createdAt: string;
}

interface Categoria {
  id: number;
  nombre: string;
  icono?: string;
}

@Component({
  selector: 'app-mis-objetos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mi-zona-container">
      <div class="header">
        <h1>Mi zona</h1>
      </div>

      <div class="tabs">
        <button
          [class.active]="tabActiva() === 'perdidos'"
          (click)="cambiarTab('perdidos')"
        >
          Mis objetos perdidos
        </button>
        <button
          [class.active]="tabActiva() === 'encontrados'"
          (click)="cambiarTab('encontrados')"
        >
          Objetos que he encontrado
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
      } @else {
        <!-- Tab Objetos Perdidos -->
        @if (tabActiva() === 'perdidos') {
          <div class="tab-content">
            <div class="tab-header">
              <h2>Objetos que he perdido</h2>
              <button class="btn btn-primary" (click)="mostrarFormulario('perdido')">
                + Reportar objeto perdido
              </button>
            </div>

            @if (mostrandoFormulario() === 'perdido') {
              <div class="formulario-reporte">
                <h3>Reportar objeto perdido</h3>
                <form (ngSubmit)="guardarObjeto('PERDIDO')">
                  <div class="form-row">
                    <div class="form-group">
                      <label>Titulo *</label>
                      <input type="text" [(ngModel)]="formObjeto.titulo" name="titulo" required
                        placeholder="Ej: Cartera negra con documentos">
                    </div>
                    <div class="form-group">
                      <label>Categoria *</label>
                      <select [(ngModel)]="formObjeto.categoriaId" name="categoriaId" required>
                        <option value="">Selecciona categoria</option>
                        @for (cat of categorias(); track cat.id) {
                          <option [value]="cat.id">{{ cat.icono }} {{ cat.nombre }}</option>
                        }
                      </select>
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Descripcion *</label>
                    <textarea [(ngModel)]="formObjeto.descripcion" name="descripcion" rows="3" required
                      placeholder="Describe el objeto con el mayor detalle posible"></textarea>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Fecha en que lo perdiste *</label>
                      <input type="date" [(ngModel)]="formObjeto.fechaHallazgo" name="fechaHallazgo" required>
                    </div>
                    <div class="form-group">
                      <label>Hora aproximada</label>
                      <input type="time" [(ngModel)]="formObjeto.horaHallazgo" name="horaHallazgo">
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Lugar donde crees que lo perdiste *</label>
                    <input type="text" [(ngModel)]="formObjeto.direccionHallazgo" name="direccionHallazgo" required
                      placeholder="Ej: Parque Central, cerca de la fuente">
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Marca</label>
                      <input type="text" [(ngModel)]="formObjeto.marca" name="marca" placeholder="Ej: Samsung, Nike...">
                    </div>
                    <div class="form-group">
                      <label>Color</label>
                      <input type="text" [(ngModel)]="formObjeto.color" name="color" placeholder="Ej: Negro, Azul...">
                    </div>
                  </div>

                  <div class="form-actions">
                    <button type="button" class="btn btn-outline" (click)="cancelarFormulario()">Cancelar</button>
                    <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                      {{ guardando() ? 'Guardando...' : 'Reportar perdido' }}
                    </button>
                  </div>
                </form>
              </div>
            }

            @if (objetosPerdidos().length === 0 && !mostrandoFormulario()) {
              <div class="empty-state">
                <span class="empty-icon">🔍</span>
                <p>No has reportado ningun objeto perdido</p>
                <button class="btn btn-outline" (click)="mostrarFormulario('perdido')">
                  Reportar mi primer objeto
                </button>
              </div>
            } @else if (!mostrandoFormulario()) {
              <div class="objetos-list">
                @for (objeto of objetosPerdidos(); track objeto.id) {
                  <div class="objeto-card">
                    <div class="objeto-imagen">
                      @if (objeto.fotoPrincipal?.thumbnailUrl) {
                        <img [src]="objeto.fotoPrincipal?.thumbnailUrl" [alt]="objeto.titulo">
                      } @else {
                        <div class="no-imagen">🔍</div>
                      }
                    </div>
                    <div class="objeto-info">
                      <h3>{{ objeto.titulo }}</h3>
                      <p class="descripcion">{{ objeto.descripcion }}</p>
                      <div class="meta">
                        <span class="categoria-badge">{{ objeto.categoria?.nombre }}</span>
                        <span class="fecha">Perdido: {{ objeto.fechaHallazgo | date:'dd/MM/yyyy' }}</span>
                        <span class="estado" [class]="'estado-' + objeto.estado.toLowerCase()">
                          {{ getEstadoLabel(objeto.estado) }}
                        </span>
                      </div>
                      @if (objeto.direccionHallazgo) {
                        <p class="lugar">📍 {{ objeto.direccionHallazgo }}</p>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Tab Objetos Encontrados -->
        @if (tabActiva() === 'encontrados') {
          <div class="tab-content">
            <div class="tab-header">
              <h2>Objetos que he encontrado</h2>
              <button class="btn btn-primary" (click)="mostrarFormulario('encontrado')">
                + Entregar objeto encontrado
              </button>
            </div>

            @if (mostrandoFormulario() === 'encontrado') {
              <div class="formulario-reporte">
                <h3>Entregar objeto encontrado</h3>
                <p class="info-entrega">Al registrar el objeto, deberás entregarlo en las oficinas municipales para su custodia.</p>
                <form (ngSubmit)="guardarObjeto('ENCONTRADO')">
                  <div class="form-row">
                    <div class="form-group">
                      <label>Titulo *</label>
                      <input type="text" [(ngModel)]="formObjeto.titulo" name="titulo" required
                        placeholder="Ej: Movil iPhone encontrado">
                    </div>
                    <div class="form-group">
                      <label>Categoria *</label>
                      <select [(ngModel)]="formObjeto.categoriaId" name="categoriaId" required>
                        <option value="">Selecciona categoria</option>
                        @for (cat of categorias(); track cat.id) {
                          <option [value]="cat.id">{{ cat.icono }} {{ cat.nombre }}</option>
                        }
                      </select>
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Descripcion *</label>
                    <textarea [(ngModel)]="formObjeto.descripcion" name="descripcion" rows="3" required
                      placeholder="Describe el objeto que has encontrado"></textarea>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Fecha en que lo encontraste *</label>
                      <input type="date" [(ngModel)]="formObjeto.fechaHallazgo" name="fechaHallazgo" required>
                    </div>
                    <div class="form-group">
                      <label>Hora aproximada</label>
                      <input type="time" [(ngModel)]="formObjeto.horaHallazgo" name="horaHallazgo">
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Lugar donde lo encontraste *</label>
                    <input type="text" [(ngModel)]="formObjeto.direccionHallazgo" name="direccionHallazgo" required
                      placeholder="Ej: Parada de autobus linea 5">
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Marca</label>
                      <input type="text" [(ngModel)]="formObjeto.marca" name="marca" placeholder="Ej: Samsung, Nike...">
                    </div>
                    <div class="form-group">
                      <label>Color</label>
                      <input type="text" [(ngModel)]="formObjeto.color" name="color" placeholder="Ej: Negro, Azul...">
                    </div>
                  </div>

                  <div class="form-actions">
                    <button type="button" class="btn btn-outline" (click)="cancelarFormulario()">Cancelar</button>
                    <button type="submit" class="btn btn-success" [disabled]="guardando()">
                      {{ guardando() ? 'Guardando...' : 'Registrar y entregar' }}
                    </button>
                  </div>
                </form>
              </div>
            }

            @if (objetosEncontrados().length === 0 && !mostrandoFormulario()) {
              <div class="empty-state">
                <span class="empty-icon">📦</span>
                <p>No has entregado ningun objeto encontrado</p>
                <button class="btn btn-outline" (click)="mostrarFormulario('encontrado')">
                  Entregar un objeto
                </button>
              </div>
            } @else if (!mostrandoFormulario()) {
              <div class="objetos-list">
                @for (objeto of objetosEncontrados(); track objeto.id) {
                  <div class="objeto-card">
                    <div class="objeto-imagen">
                      @if (objeto.fotoPrincipal?.thumbnailUrl) {
                        <img [src]="objeto.fotoPrincipal?.thumbnailUrl" [alt]="objeto.titulo">
                      } @else {
                        <div class="no-imagen">📦</div>
                      }
                    </div>
                    <div class="objeto-info">
                      <h3>{{ objeto.titulo }}</h3>
                      <p class="codigo">{{ objeto.codigoUnico }}</p>
                      <p class="descripcion">{{ objeto.descripcion }}</p>
                      <div class="meta">
                        <span class="categoria-badge">{{ objeto.categoria?.nombre }}</span>
                        <span class="fecha">Encontrado: {{ objeto.fechaHallazgo | date:'dd/MM/yyyy' }}</span>
                        <span class="estado" [class]="'estado-' + objeto.estado.toLowerCase()">
                          {{ getEstadoLabel(objeto.estado) }}
                        </span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Tab Solicitudes -->
        @if (tabActiva() === 'solicitudes') {
          <div class="tab-content">
            <div class="tab-header">
              <h2>Mis solicitudes de recuperacion</h2>
            </div>

            @if (solicitudes().length === 0) {
              <div class="empty-state">
                <span class="empty-icon">📋</span>
                <p>No tienes solicitudes de recuperacion</p>
                <a routerLink="/galeria" class="btn btn-outline">
                  Buscar en la galeria
                </a>
              </div>
            } @else {
              <div class="solicitudes-list">
                @for (solicitud of solicitudes(); track solicitud.id) {
                  <div class="solicitud-card">
                    <div class="solicitud-objeto">
                      @if (solicitud.objeto) {
                        <div class="objeto-mini">
                          @if (solicitud.objeto.fotoPrincipal?.thumbnailUrl) {
                            <img [src]="solicitud.objeto.fotoPrincipal.thumbnailUrl" [alt]="solicitud.objeto.titulo">
                          } @else {
                            <div class="mini-placeholder">📦</div>
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
                        <span class="cita">📅 Cita: {{ solicitud.fechaCita | date:'dd/MM/yyyy HH:mm' }}</span>
                      }
                      @if (solicitud.motivoRechazo) {
                        <p class="rechazo">❌ {{ solicitud.motivoRechazo }}</p>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .mi-zona-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      margin-bottom: 2rem;
    }

    h1 { margin: 0; }

    .tabs {
      display: flex;
      gap: 0;
      margin-bottom: 2rem;
      border-bottom: 2px solid #eee;
      overflow-x: auto;
    }

    .tabs button {
      padding: 1rem 1.5rem;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 0.9rem;
      color: #666;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      white-space: nowrap;
    }

    .tabs button.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }

    .tab-content { margin-bottom: 2rem; }

    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .tab-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: #f9f9f9;
      border-radius: 12px;
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 1.5rem;
    }

    .formulario-reporte {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .formulario-reporte h3 {
      margin: 0 0 1rem;
    }

    .info-entrega {
      background: #e3f2fd;
      color: #1565c0;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
      color: #333;
      background: white;
    }

    .form-group select option {
      color: #333;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #eee;
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
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .objeto-imagen {
      width: 100px;
      height: 100px;
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
      font-size: 2rem;
    }

    .objeto-info { flex: 1; }

    .objeto-info h3 {
      margin: 0 0 0.25rem;
      font-size: 1.1rem;
    }

    .codigo {
      font-family: monospace;
      font-size: 0.8rem;
      color: #999;
      margin: 0 0 0.5rem;
    }

    .descripcion {
      color: #666;
      margin: 0 0 0.75rem;
      font-size: 0.9rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
      font-size: 0.85rem;
    }

    .categoria-badge {
      background: #e0e0e0;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .fecha { color: #999; }

    .lugar {
      margin: 0.5rem 0 0;
      font-size: 0.85rem;
      color: #666;
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

    .solicitud-card {
      display: flex;
      gap: 1.5rem;
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      align-items: center;
    }

    .objeto-mini {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .objeto-mini img {
      width: 60px;
      height: 60px;
      border-radius: 6px;
      object-fit: cover;
    }

    .mini-placeholder {
      width: 60px;
      height: 60px;
      border-radius: 6px;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .objeto-mini h4 { margin: 0 0 0.25rem; }

    .solicitud-info {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }

    .estado-solicitud {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
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
      font-size: 0.9rem;
    }

    .btn-primary { background: #667eea; color: white; }
    .btn-success { background: #27ae60; color: white; }
    .btn-outline { background: white; border: 1px solid #667eea; color: #667eea; }

    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    @media (max-width: 600px) {
      .form-row { grid-template-columns: 1fr; }
      .objeto-card { flex-direction: column; }
      .objeto-imagen { width: 100%; height: 180px; }
      .solicitud-card { flex-direction: column; align-items: flex-start; }
      .tab-header { flex-direction: column; gap: 1rem; align-items: flex-start; }
    }
  `]
})
export class MisObjetosComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  tabActiva = signal<'perdidos' | 'encontrados' | 'solicitudes'>('perdidos');
  objetosPerdidos = signal<Objeto[]>([]);
  objetosEncontrados = signal<Objeto[]>([]);
  solicitudes = signal<any[]>([]);
  categorias = signal<Categoria[]>([]);
  loading = signal(true);
  guardando = signal(false);

  mostrandoFormulario = signal<'perdido' | 'encontrado' | null>(null);

  formObjeto = {
    titulo: '',
    descripcion: '',
    categoriaId: '',
    fechaHallazgo: '',
    horaHallazgo: '',
    direccionHallazgo: '',
    marca: '',
    color: ''
  };

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/mis-objetos' }
      });
      return;
    }

    this.loadCategorias();
    this.loadData();

    // Check query params for action
    const accion = this.route.snapshot.queryParams['accion'];
    if (accion === 'perdido') {
      this.tabActiva.set('perdidos');
      this.mostrarFormulario('perdido');
    } else if (accion === 'encontrado') {
      this.tabActiva.set('encontrados');
      this.mostrarFormulario('encontrado');
    }

    // Set default date to today
    this.formObjeto.fechaHallazgo = new Date().toISOString().split('T')[0];
  }

  private loadCategorias() {
    this.api.get<any>('/categorias').subscribe({
      next: (response) => this.categorias.set(response.data || response)
    });
  }

  private loadData() {
    this.loading.set(true);
    this.api.get<any>('/mis-objetos').subscribe({
      next: (data) => {
        this.objetosPerdidos.set(data.perdidos || []);
        this.objetosEncontrados.set(data.encontrados || []);
        this.solicitudes.set(data.solicitudes || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  cambiarTab(tab: 'perdidos' | 'encontrados' | 'solicitudes') {
    this.tabActiva.set(tab);
    this.cancelarFormulario();
  }

  mostrarFormulario(tipo: 'perdido' | 'encontrado') {
    this.mostrandoFormulario.set(tipo);
    this.resetForm();
  }

  cancelarFormulario() {
    this.mostrandoFormulario.set(null);
    this.resetForm();
  }

  private resetForm() {
    this.formObjeto = {
      titulo: '',
      descripcion: '',
      categoriaId: '',
      fechaHallazgo: new Date().toISOString().split('T')[0],
      horaHallazgo: '',
      direccionHallazgo: '',
      marca: '',
      color: ''
    };
  }

  guardarObjeto(tipo: 'PERDIDO' | 'ENCONTRADO') {
    if (!this.formObjeto.titulo || !this.formObjeto.categoriaId ||
        !this.formObjeto.descripcion || !this.formObjeto.fechaHallazgo ||
        !this.formObjeto.direccionHallazgo) {
      alert('Por favor, completa todos los campos obligatorios');
      return;
    }

    this.guardando.set(true);

    const data = {
      ...this.formObjeto,
      tipo
    };

    this.api.post('/objetos/reportar', data).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cancelarFormulario();
        this.loadData();
        alert(tipo === 'PERDIDO'
          ? 'Objeto perdido registrado. Te avisaremos si aparece.'
          : 'Gracias por entregar el objeto. Acude a las oficinas municipales para completar la entrega.');
      },
      error: (err) => {
        this.guardando.set(false);
        alert(err.error?.message || 'Error al guardar');
      }
    });
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      'REGISTRADO': 'Registrado',
      'EN_ALMACEN': 'En almacen',
      'RECLAMADO': 'Reclamado',
      'ENTREGADO': 'Entregado'
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
}
