import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface DashboardStats {
  objetosTotal: number;
  objetosHoy: number;
  objetosEnAlmacen: number;
  solicitudesPendientes: number;
  coincidenciasPendientes: number;
  subastasActivas: number;
  entregasHoy: number;
  tasaRecuperacion: number;
}

interface ObjetoReciente {
  id: number;
  codigoUnico: string;
  titulo: string;
  estado: string;
  createdAt: string;
}

interface SolicitudReciente {
  id: number;
  objeto: {
    titulo: string;
    codigoUnico: string;
  };
  ciudadano: {
    nombre: string;
  };
  estado: string;
  createdAt: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Panel de administracion</h1>
        <p>Bienvenido al sistema de gestion de objetos perdidos</p>
      </div>

      @if (loading()) {
        <div class="loading">Cargando estadisticas...</div>
      } @else {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon objetos">📦</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats()?.objetosTotal || 0 }}</span>
              <span class="stat-label">Objetos totales</span>
              <span class="stat-extra">+{{ stats()?.objetosHoy || 0 }} hoy</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon almacen">🏢</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats()?.objetosEnAlmacen || 0 }}</span>
              <span class="stat-label">En almacen</span>
            </div>
          </div>

          <div class="stat-card urgente">
            <div class="stat-icon solicitudes">📋</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats()?.solicitudesPendientes || 0 }}</span>
              <span class="stat-label">Solicitudes pendientes</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon coincidencias">🔗</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats()?.coincidenciasPendientes || 0 }}</span>
              <span class="stat-label">Coincidencias por revisar</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon subastas">🔨</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats()?.subastasActivas || 0 }}</span>
              <span class="stat-label">Subastas activas</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon entregas">✅</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats()?.entregasHoy || 0 }}</span>
              <span class="stat-label">Entregas hoy</span>
            </div>
          </div>
        </div>

        <div class="tasa-recuperacion">
          <div class="tasa-header">
            <span>Tasa de recuperacion</span>
            <span class="tasa-valor">{{ stats()?.tasaRecuperacion || 0 }}%</span>
          </div>
          <div class="tasa-barra">
            <div class="tasa-progreso" [style.width.%]="stats()?.tasaRecuperacion || 0"></div>
          </div>
        </div>

        <div class="acciones-rapidas">
          <h2>Acciones rapidas</h2>
          <div class="acciones-grid">
            <a routerLink="/admin/objetos/nuevo" class="accion-card">
              <span class="accion-icon">➕</span>
              <span class="accion-label">Registrar objeto</span>
            </a>
            <a routerLink="/admin/solicitudes" class="accion-card">
              <span class="accion-icon">📋</span>
              <span class="accion-label">Ver solicitudes</span>
            </a>
            <a routerLink="/admin/coincidencias" class="accion-card">
              <span class="accion-icon">🔍</span>
              <span class="accion-label">Revisar coincidencias</span>
            </a>
            <a routerLink="/admin/almacen" class="accion-card">
              <span class="accion-icon">🗺️</span>
              <span class="accion-label">Mapa almacen</span>
            </a>
          </div>
        </div>

        <div class="listas-recientes">
          <div class="lista-card">
            <div class="lista-header">
              <h3>Ultimos objetos registrados</h3>
              <a routerLink="/admin/objetos">Ver todos</a>
            </div>
            @if (objetosRecientes().length === 0) {
              <p class="sin-datos">No hay objetos recientes</p>
            } @else {
              <div class="lista-items">
                @for (objeto of objetosRecientes(); track objeto.id) {
                  <div class="lista-item">
                    <div class="item-info">
                      <span class="item-codigo">{{ objeto.codigoUnico }}</span>
                      <span class="item-titulo">{{ objeto.titulo }}</span>
                    </div>
                    <div class="item-meta">
                      <span class="item-estado" [class]="'estado-' + objeto.estado.toLowerCase()">
                        {{ getEstadoLabel(objeto.estado) }}
                      </span>
                      <span class="item-fecha">{{ objeto.createdAt | date:'dd/MM HH:mm' }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <div class="lista-card">
            <div class="lista-header">
              <h3>Solicitudes recientes</h3>
              <a routerLink="/admin/solicitudes">Ver todas</a>
            </div>
            @if (solicitudesRecientes().length === 0) {
              <p class="sin-datos">No hay solicitudes recientes</p>
            } @else {
              <div class="lista-items">
                @for (sol of solicitudesRecientes(); track sol.id) {
                  <div class="lista-item">
                    <div class="item-info">
                      <span class="item-titulo">{{ sol.objeto.titulo }}</span>
                      <span class="item-subtitulo">Por: {{ sol.ciudadano.nombre }}</span>
                    </div>
                    <div class="item-meta">
                      <span class="item-estado" [class]="'estado-sol-' + sol.estado.toLowerCase()">
                        {{ getSolicitudEstadoLabel(sol.estado) }}
                      </span>
                      <span class="item-fecha">{{ sol.createdAt | date:'dd/MM HH:mm' }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
    }

    .dashboard-header {
      margin-bottom: 2rem;
    }

    .dashboard-header h1 {
      margin: 0 0 0.5rem;
    }

    .dashboard-header p {
      color: #666;
      margin: 0;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .stat-card.urgente {
      border-left: 4px solid #ff9800;
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .stat-icon.objetos { background: #e3f2fd; }
    .stat-icon.almacen { background: #fff3e0; }
    .stat-icon.solicitudes { background: #fff9c4; }
    .stat-icon.coincidencias { background: #e8f5e9; }
    .stat-icon.subastas { background: #fce4ec; }
    .stat-icon.entregas { background: #e8f5e9; }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #333;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #666;
    }

    .stat-extra {
      font-size: 0.75rem;
      color: #4caf50;
    }

    .tasa-recuperacion {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      margin-bottom: 2rem;
    }

    .tasa-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .tasa-valor {
      font-weight: 700;
      color: #667eea;
    }

    .tasa-barra {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .tasa-progreso {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .acciones-rapidas {
      margin-bottom: 2rem;
    }

    .acciones-rapidas h2 {
      margin: 0 0 1rem;
      font-size: 1.25rem;
    }

    .acciones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .accion-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      text-align: center;
      text-decoration: none;
      color: #333;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .accion-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.12);
    }

    .accion-icon {
      display: block;
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .accion-label {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .listas-recientes {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .lista-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .lista-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .lista-header h3 {
      margin: 0;
      font-size: 1rem;
    }

    .lista-header a {
      color: #667eea;
      text-decoration: none;
      font-size: 0.875rem;
    }

    .sin-datos {
      text-align: center;
      padding: 2rem;
      color: #999;
    }

    .lista-items {
      max-height: 300px;
      overflow-y: auto;
    }

    .lista-item {
      display: flex;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f5f5f5;
    }

    .lista-item:last-child {
      border-bottom: none;
    }

    .item-info {
      display: flex;
      flex-direction: column;
    }

    .item-codigo {
      font-size: 0.75rem;
      color: #999;
    }

    .item-titulo {
      font-weight: 500;
    }

    .item-subtitulo {
      font-size: 0.875rem;
      color: #666;
    }

    .item-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .item-estado {
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .estado-registrado { background: #e3f2fd; color: #1976d2; }
    .estado-en_almacen { background: #fff3e0; color: #f57c00; }
    .estado-reclamado { background: #fff9c4; color: #f9a825; }
    .estado-entregado { background: #e8f5e9; color: #388e3c; }

    .estado-sol-pendiente { background: #fff3e0; color: #f57c00; }
    .estado-sol-validando { background: #e3f2fd; color: #1976d2; }
    .estado-sol-aprobada { background: #e8f5e9; color: #388e3c; }
    .estado-sol-rechazada { background: #ffebee; color: #c62828; }

    .item-fecha {
      font-size: 0.75rem;
      color: #999;
      margin-top: 0.25rem;
    }

    @media (max-width: 768px) {
      .listas-recientes {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  stats = signal<DashboardStats | null>(null);
  objetosRecientes = signal<ObjetoReciente[]>([]);
  solicitudesRecientes = signal<SolicitudReciente[]>([]);

  ngOnInit() {
    this.loadDashboard();
  }

  private loadDashboard() {
    this.api.get<any>('/admin/estadisticas/dashboard').subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        this.objetosRecientes.set(data.objetosRecientes || []);
        this.solicitudesRecientes.set(data.solicitudesRecientes || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
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
      'VALIDANDO': 'Validando',
      'APROBADA': 'Aprobada',
      'RECHAZADA': 'Rechazada',
      'ENTREGADA': 'Entregada'
    };
    return labels[estado] || estado;
  }
}
