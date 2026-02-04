import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface Estadisticas {
  resumen: {
    objetosTotal: number;
    objetosEsteMes: number;
    solicitudesTotal: number;
    solicitudesEsteMes: number;
    tasaRecuperacion: number;
    tiempoPromedioEntrega: number;
  };
  objetosPorEstado: { estado: string; cantidad: number }[];
  objetosPorCategoria: { categoria: string; cantidad: number }[];
  objetosPorMes: { mes: string; cantidad: number }[];
  solicitudesPorEstado: { estado: string; cantidad: number }[];
}

@Component({
  selector: 'app-estadisticas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="estadisticas-container">
      <div class="header">
        <h1>Estadisticas</h1>
        <div class="periodo-selector">
          <select [(ngModel)]="periodo" (change)="cargarEstadisticas()">
            <option value="mes">Este mes</option>
            <option value="trimestre">Ultimo trimestre</option>
            <option value="ano">Este ano</option>
            <option value="todo">Todo el tiempo</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="loading">Cargando estadisticas...</div>
      } @else if (stats()) {
        <div class="resumen-grid">
          <div class="resumen-card">
            <div class="resumen-icon">📦</div>
            <div class="resumen-content">
              <span class="resumen-valor">{{ stats()!.resumen.objetosTotal }}</span>
              <span class="resumen-label">Objetos totales</span>
              <span class="resumen-extra">+{{ stats()!.resumen.objetosEsteMes }} este mes</span>
            </div>
          </div>

          <div class="resumen-card">
            <div class="resumen-icon">📋</div>
            <div class="resumen-content">
              <span class="resumen-valor">{{ stats()!.resumen.solicitudesTotal }}</span>
              <span class="resumen-label">Solicitudes totales</span>
              <span class="resumen-extra">+{{ stats()!.resumen.solicitudesEsteMes }} este mes</span>
            </div>
          </div>

          <div class="resumen-card destacado">
            <div class="resumen-icon">✅</div>
            <div class="resumen-content">
              <span class="resumen-valor">{{ stats()!.resumen.tasaRecuperacion }}%</span>
              <span class="resumen-label">Tasa de recuperacion</span>
            </div>
          </div>

          <div class="resumen-card">
            <div class="resumen-icon">⏱️</div>
            <div class="resumen-content">
              <span class="resumen-valor">{{ stats()!.resumen.tiempoPromedioEntrega }}</span>
              <span class="resumen-label">Dias promedio entrega</span>
            </div>
          </div>
        </div>

        <div class="graficos-grid">
          <div class="grafico-card">
            <h3>Objetos por estado</h3>
            <div class="barras-chart">
              @for (item of stats()!.objetosPorEstado; track item.estado) {
                <div class="barra-item">
                  <span class="barra-label">{{ item.estado }}</span>
                  <div class="barra-container">
                    <div
                      class="barra-fill"
                      [style.width.%]="getPercentage(item.cantidad, stats()!.objetosPorEstado)"
                      [class]="'estado-' + item.estado.toLowerCase()"
                    ></div>
                  </div>
                  <span class="barra-valor">{{ item.cantidad }}</span>
                </div>
              }
            </div>
          </div>

          <div class="grafico-card">
            <h3>Objetos por categoria</h3>
            <div class="barras-chart">
              @for (item of stats()!.objetosPorCategoria.slice(0, 8); track item.categoria) {
                <div class="barra-item">
                  <span class="barra-label">{{ item.categoria }}</span>
                  <div class="barra-container">
                    <div
                      class="barra-fill categoria"
                      [style.width.%]="getPercentage(item.cantidad, stats()!.objetosPorCategoria)"
                    ></div>
                  </div>
                  <span class="barra-valor">{{ item.cantidad }}</span>
                </div>
              }
            </div>
          </div>

          <div class="grafico-card wide">
            <h3>Objetos registrados por mes</h3>
            <div class="linea-chart">
              @for (item of stats()!.objetosPorMes; track item.mes) {
                <div class="mes-item">
                  <div class="mes-barra-container">
                    <div
                      class="mes-barra"
                      [style.height.%]="getPercentage(item.cantidad, stats()!.objetosPorMes)"
                    ></div>
                  </div>
                  <span class="mes-label">{{ item.mes }}</span>
                  <span class="mes-valor">{{ item.cantidad }}</span>
                </div>
              }
            </div>
          </div>

          <div class="grafico-card">
            <h3>Solicitudes por estado</h3>
            <div class="donut-chart">
              @for (item of stats()!.solicitudesPorEstado; track item.estado) {
                <div class="donut-item">
                  <span class="donut-color" [class]="'solicitud-' + item.estado.toLowerCase()"></span>
                  <span class="donut-label">{{ item.estado }}</span>
                  <span class="donut-valor">{{ item.cantidad }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .estadisticas-container {
      padding: 2rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h1 { margin: 0; }

    .periodo-selector select {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .resumen-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .resumen-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .resumen-card.destacado {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }

    .resumen-icon {
      font-size: 2rem;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      border-radius: 12px;
    }

    .destacado .resumen-icon {
      background: rgba(255,255,255,0.2);
    }

    .resumen-content {
      display: flex;
      flex-direction: column;
    }

    .resumen-valor {
      font-size: 2rem;
      font-weight: 700;
    }

    .resumen-label {
      font-size: 0.875rem;
      color: #666;
    }

    .destacado .resumen-label {
      color: rgba(255,255,255,0.8);
    }

    .resumen-extra {
      font-size: 0.75rem;
      color: #4caf50;
    }

    .destacado .resumen-extra {
      color: rgba(255,255,255,0.6);
    }

    .graficos-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .grafico-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .grafico-card.wide {
      grid-column: span 2;
    }

    .grafico-card h3 {
      margin: 0 0 1.5rem;
      font-size: 1rem;
    }

    .barras-chart {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .barra-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .barra-label {
      width: 100px;
      font-size: 0.875rem;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    .barra-container {
      flex: 1;
      height: 24px;
      background: #f5f5f5;
      border-radius: 4px;
      overflow: hidden;
    }

    .barra-fill {
      height: 100%;
      background: #667eea;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .barra-fill.estado-registrado { background: #2196f3; }
    .barra-fill.estado-en_almacen { background: #ff9800; }
    .barra-fill.estado-reclamado { background: #ffc107; }
    .barra-fill.estado-entregado { background: #4caf50; }
    .barra-fill.estado-subasta { background: #9c27b0; }

    .barra-fill.categoria { background: #667eea; }

    .barra-valor {
      width: 50px;
      text-align: right;
      font-weight: 600;
      color: #666;
    }

    .linea-chart {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
      height: 200px;
      padding-top: 1rem;
    }

    .mes-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .mes-barra-container {
      height: 150px;
      width: 100%;
      display: flex;
      align-items: flex-end;
    }

    .mes-barra {
      width: 100%;
      background: linear-gradient(180deg, #667eea, #764ba2);
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      transition: height 0.5s ease;
    }

    .mes-label {
      font-size: 0.75rem;
      color: #999;
      margin-top: 0.5rem;
    }

    .mes-valor {
      font-size: 0.75rem;
      font-weight: 600;
      color: #667eea;
    }

    .donut-chart {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .donut-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .donut-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }

    .donut-color.solicitud-pendiente { background: #ff9800; }
    .donut-color.solicitud-validando { background: #2196f3; }
    .donut-color.solicitud-aprobada { background: #4caf50; }
    .donut-color.solicitud-rechazada { background: #f44336; }
    .donut-color.solicitud-entregada { background: #9e9e9e; }

    .donut-label {
      flex: 1;
      font-size: 0.875rem;
    }

    .donut-valor {
      font-weight: 600;
      color: #666;
    }

    @media (max-width: 900px) {
      .graficos-grid {
        grid-template-columns: 1fr;
      }

      .grafico-card.wide {
        grid-column: 1;
      }
    }
  `]
})
export class EstadisticasAdminComponent implements OnInit {
  private api = inject(ApiService);

  stats = signal<Estadisticas | null>(null);
  loading = signal(true);
  periodo = 'mes';

  ngOnInit() {
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    this.loading.set(true);
    this.api.get<Estadisticas>(`/admin/estadisticas/objetos?periodo=${this.periodo}`).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getPercentage(value: number, items: { cantidad?: number }[]): number {
    const max = Math.max(...items.map(i => i.cantidad || 0));
    if (max === 0) return 0;
    return (value / max) * 100;
  }
}
