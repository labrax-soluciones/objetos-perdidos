import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

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
  totalPujas: number;
}

@Component({
  selector: 'app-subastas-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="subastas-container">
      <div class="header">
        <h1>Subastas</h1>
        <p>Objetos perdidos no reclamados en mas de 2 anos</p>
      </div>

      <div class="filtros">
        <button
          [class.active]="filtroActivo() === 'activas'"
          (click)="filtrar('activas')"
        >
          Activas
        </button>
        <button
          [class.active]="filtroActivo() === 'proximas'"
          (click)="filtrar('proximas')"
        >
          Proximas
        </button>
        <button
          [class.active]="filtroActivo() === 'finalizadas'"
          (click)="filtrar('finalizadas')"
        >
          Finalizadas
        </button>
      </div>

      @if (loading()) {
        <div class="loading">Cargando subastas...</div>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else if (subastas().length === 0) {
        <div class="empty-state">
          <p>No hay subastas {{ filtroActivo() }} en este momento</p>
        </div>
      } @else {
        <div class="subastas-grid">
          @for (subasta of subastas(); track subasta.id) {
            <div class="subasta-card">
              <div class="subasta-imagen">
                @if (subasta.lote.objetos.length > 0 && subasta.lote.objetos[0].fotos?.length > 0) {
                  <img [src]="subasta.lote.objetos[0].fotos[0].thumbnailUrl" [alt]="subasta.lote.nombre">
                } @else {
                  <div class="no-imagen">
                    <span>{{ subasta.lote.objetos.length }} objeto(s)</span>
                  </div>
                }
                <span class="estado-badge" [class]="'estado-' + subasta.estado.toLowerCase()">
                  {{ getEstadoLabel(subasta.estado) }}
                </span>
              </div>

              <div class="subasta-info">
                <span class="codigo">Lote {{ subasta.lote.codigo }}</span>
                <h3>{{ subasta.lote.nombre }}</h3>

                <div class="precios">
                  <div class="precio-actual">
                    <span class="label">Puja actual</span>
                    <span class="valor">{{ subasta.precioActual | currency:'EUR' }}</span>
                  </div>
                  <div class="precio-salida">
                    <span class="label">Precio salida</span>
                    <span class="valor">{{ subasta.precioSalida | currency:'EUR' }}</span>
                  </div>
                </div>

                <div class="tiempo">
                  @if (subasta.estado === 'ACTIVA') {
                    <span class="tiempo-restante">
                      Termina: {{ subasta.fechaFin | date:'dd/MM/yyyy HH:mm' }}
                    </span>
                  } @else if (subasta.estado === 'PROGRAMADA') {
                    <span class="tiempo-inicio">
                      Inicia: {{ subasta.fechaInicio | date:'dd/MM/yyyy HH:mm' }}
                    </span>
                  } @else {
                    <span class="tiempo-fin">
                      Finalizo: {{ subasta.fechaFin | date:'dd/MM/yyyy' }}
                    </span>
                  }
                </div>

                <div class="pujas-count">
                  {{ subasta.totalPujas }} puja(s)
                </div>

                <a [routerLink]="['/subastas', subasta.id]" class="btn btn-primary">
                  @if (subasta.estado === 'ACTIVA') {
                    Pujar ahora
                  } @else {
                    Ver detalle
                  }
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .subastas-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      margin-bottom: 2rem;
    }

    .header h1 {
      margin: 0 0 0.5rem;
    }

    .header p {
      color: #666;
      margin: 0;
    }

    .filtros {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }

    .filtros button {
      padding: 0.5rem 1.5rem;
      border: 1px solid #ddd;
      background: white;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .filtros button:hover {
      border-color: #667eea;
    }

    .filtros button.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
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
      padding: 4rem;
      background: #f9f9f9;
      border-radius: 8px;
      color: #666;
    }

    .subastas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .subasta-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .subasta-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }

    .subasta-imagen {
      position: relative;
      height: 200px;
      background: #f0f0f0;
    }

    .subasta-imagen img {
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
      font-size: 1.25rem;
    }

    .estado-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .estado-activa {
      background: #4caf50;
      color: white;
    }

    .estado-programada {
      background: #ff9800;
      color: white;
    }

    .estado-cerrada, .estado-adjudicada {
      background: #9e9e9e;
      color: white;
    }

    .subasta-info {
      padding: 1.5rem;
    }

    .codigo {
      font-size: 0.75rem;
      color: #999;
      text-transform: uppercase;
    }

    h3 {
      margin: 0.5rem 0 1rem;
      font-size: 1.25rem;
    }

    .precios {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .precio-actual, .precio-salida {
      text-align: center;
      padding: 0.75rem;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .label {
      display: block;
      font-size: 0.75rem;
      color: #999;
      margin-bottom: 0.25rem;
    }

    .precio-actual .valor {
      font-size: 1.25rem;
      font-weight: 600;
      color: #667eea;
    }

    .precio-salida .valor {
      font-size: 1rem;
      color: #666;
    }

    .tiempo {
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }

    .tiempo-restante {
      color: #e53935;
    }

    .tiempo-inicio {
      color: #ff9800;
    }

    .tiempo-fin {
      color: #999;
    }

    .pujas-count {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 1rem;
    }

    .btn {
      display: block;
      width: 100%;
      padding: 0.75rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a6fd6;
    }

    @media (max-width: 600px) {
      .subastas-grid {
        grid-template-columns: 1fr;
      }

      .filtros {
        flex-wrap: wrap;
      }
    }
  `]
})
export class SubastasListComponent implements OnInit {
  private api = inject(ApiService);

  subastas = signal<Subasta[]>([]);
  loading = signal(true);
  error = signal('');
  filtroActivo = signal<'activas' | 'proximas' | 'finalizadas'>('activas');

  ngOnInit() {
    this.loadSubastas();
  }

  filtrar(filtro: 'activas' | 'proximas' | 'finalizadas') {
    this.filtroActivo.set(filtro);
    this.loadSubastas();
  }

  private loadSubastas() {
    this.loading.set(true);
    this.error.set('');

    const estado = this.filtroActivo() === 'activas' ? 'ACTIVA' :
                   this.filtroActivo() === 'proximas' ? 'PROGRAMADA' : 'CERRADA';

    this.api.get<Subasta[]>(`/subastas?estado=${estado}`).subscribe({
      next: (subastas) => {
        this.subastas.set(subastas);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Error al cargar las subastas');
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
