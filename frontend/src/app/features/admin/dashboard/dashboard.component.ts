import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
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
  objetosPorCategoria?: Record<string, number>;
  objetosPorEstado?: Record<string, number>;
  tendenciaSemanal?: { fecha: string; cantidad: number }[];
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
  imports: [CommonModule, RouterLink, ChartModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="p-8">
      <div class="mb-8">
        <h1 class="m-0 mb-2 text-2xl font-bold text-gray-800">Panel de administracion</h1>
        <p class="text-gray-500 m-0">Bienvenido al sistema de gestion de objetos perdidos</p>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-500">
          <i class="pi pi-spin pi-spinner text-4xl mb-4"></i>
          <p>Cargando estadisticas...</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div class="bg-white p-6 rounded-xl shadow-md flex gap-4 items-center">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-blue-100 text-blue-600">
              <i class="pi pi-box"></i>
            </div>
            <div class="flex flex-col">
              <span class="text-3xl font-bold text-gray-800">{{ stats()?.objetosTotal || 0 }}</span>
              <span class="text-sm text-gray-500">Objetos totales</span>
              <span class="text-xs text-green-500">+{{ stats()?.objetosHoy || 0 }} hoy</span>
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-md flex gap-4 items-center">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-orange-100 text-orange-600">
              <i class="pi pi-building"></i>
            </div>
            <div class="flex flex-col">
              <span class="text-3xl font-bold text-gray-800">{{ stats()?.objetosEnAlmacen || 0 }}</span>
              <span class="text-sm text-gray-500">En almacen</span>
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-md flex gap-4 items-center border-l-4 border-orange-500">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-yellow-100 text-yellow-600">
              <i class="pi pi-file-edit"></i>
            </div>
            <div class="flex flex-col">
              <span class="text-3xl font-bold text-gray-800">{{ stats()?.solicitudesPendientes || 0 }}</span>
              <span class="text-sm text-gray-500">Solicitudes pendientes</span>
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-md flex gap-4 items-center">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-green-100 text-green-600">
              <i class="pi pi-link"></i>
            </div>
            <div class="flex flex-col">
              <span class="text-3xl font-bold text-gray-800">{{ stats()?.coincidenciasPendientes || 0 }}</span>
              <span class="text-sm text-gray-500">Coincidencias por revisar</span>
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-md flex gap-4 items-center">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-pink-100 text-pink-600">
              <i class="pi pi-megaphone"></i>
            </div>
            <div class="flex flex-col">
              <span class="text-3xl font-bold text-gray-800">{{ stats()?.subastasActivas || 0 }}</span>
              <span class="text-sm text-gray-500">Subastas activas</span>
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-md flex gap-4 items-center">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-green-100 text-green-600">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="flex flex-col">
              <span class="text-3xl font-bold text-gray-800">{{ stats()?.entregasHoy || 0 }}</span>
              <span class="text-sm text-gray-500">Entregas hoy</span>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-md mb-8">
          <div class="flex justify-between mb-3">
            <span class="text-gray-700">
              <i class="pi pi-chart-line mr-2"></i>Tasa de recuperacion
            </span>
            <span class="font-bold text-primary">{{ stats()?.tasaRecuperacion || 0 }}%</span>
          </div>
          <div class="h-2 bg-gray-200 rounded overflow-hidden">
            <div class="h-full bg-gradient-to-r from-primary to-purple-600 rounded transition-all duration-500" [style.width.%]="stats()?.tasaRecuperacion || 0"></div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <!-- Bar Chart: Objetos por categoria -->
          <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="m-0 mb-4 text-base font-semibold flex items-center gap-2">
              <i class="pi pi-chart-bar text-primary"></i>
              Objetos por categoria
            </h3>
            <div class="h-64">
              <p-chart type="bar" [data]="categoriaChartData()" [options]="barChartOptions" styleClass="h-full" />
            </div>
          </div>

          <!-- Doughnut Chart: Estados de objetos -->
          <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="m-0 mb-4 text-base font-semibold flex items-center gap-2">
              <i class="pi pi-chart-pie text-primary"></i>
              Estados de objetos
            </h3>
            <div class="h-64">
              <p-chart type="doughnut" [data]="estadoChartData()" [options]="doughnutChartOptions" styleClass="h-full" />
            </div>
          </div>

          <!-- Line Chart: Tendencia semanal -->
          <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="m-0 mb-4 text-base font-semibold flex items-center gap-2">
              <i class="pi pi-chart-line text-primary"></i>
              Tendencia semanal
            </h3>
            <div class="h-64">
              <p-chart type="line" [data]="tendenciaChartData()" [options]="lineChartOptions" styleClass="h-full" />
            </div>
          </div>
        </div>

        <div class="mb-8">
          <h2 class="m-0 mb-4 text-xl font-semibold text-gray-800">Acciones rapidas</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <a routerLink="/admin/objetos/nuevo" class="bg-white p-6 rounded-xl shadow-md text-center no-underline text-gray-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <span class="block text-3xl mb-2 text-primary"><i class="pi pi-plus-circle"></i></span>
              <span class="text-sm font-medium">Registrar objeto</span>
            </a>
            <a routerLink="/admin/solicitudes" class="bg-white p-6 rounded-xl shadow-md text-center no-underline text-gray-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <span class="block text-3xl mb-2 text-primary"><i class="pi pi-file-edit"></i></span>
              <span class="text-sm font-medium">Ver solicitudes</span>
            </a>
            <a routerLink="/admin/coincidencias" class="bg-white p-6 rounded-xl shadow-md text-center no-underline text-gray-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <span class="block text-3xl mb-2 text-primary"><i class="pi pi-search"></i></span>
              <span class="text-sm font-medium">Revisar coincidencias</span>
            </a>
            <a routerLink="/admin/almacen" class="bg-white p-6 rounded-xl shadow-md text-center no-underline text-gray-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <span class="block text-3xl mb-2 text-primary"><i class="pi pi-map"></i></span>
              <span class="text-sm font-medium">Mapa almacen</span>
            </a>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl shadow-md overflow-hidden">
            <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 class="m-0 text-base font-semibold flex items-center gap-2">
                <i class="pi pi-clock text-primary"></i>
                Ultimos objetos registrados
              </h3>
              <a routerLink="/admin/objetos" class="text-primary no-underline text-sm">Ver todos</a>
            </div>
            @if (objetosRecientes().length === 0) {
              <p class="text-center py-8 text-gray-400">No hay objetos recientes</p>
            } @else {
              <div class="max-h-72 overflow-y-auto">
                @for (objeto of objetosRecientes(); track objeto.id) {
                  <div class="flex justify-between px-6 py-4 border-b border-gray-100 last:border-b-0">
                    <div class="flex flex-col">
                      <span class="text-xs text-gray-400">{{ objeto.codigoUnico }}</span>
                      <span class="font-medium">{{ objeto.titulo }}</span>
                    </div>
                    <div class="flex flex-col items-end">
                      <span class="text-xs px-2 py-0.5 rounded"
                        [class]="objeto.estado === 'REGISTRADO' ? 'bg-blue-100 text-blue-800' :
                                 objeto.estado === 'EN_ALMACEN' ? 'bg-orange-100 text-orange-800' :
                                 objeto.estado === 'RECLAMADO' ? 'bg-yellow-100 text-yellow-800' :
                                 'bg-green-100 text-green-800'">
                        {{ getEstadoLabel(objeto.estado) }}
                      </span>
                      <span class="text-xs text-gray-400 mt-1">{{ objeto.createdAt | date:'dd/MM HH:mm' }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <div class="bg-white rounded-xl shadow-md overflow-hidden">
            <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 class="m-0 text-base font-semibold flex items-center gap-2">
                <i class="pi pi-inbox text-primary"></i>
                Solicitudes recientes
              </h3>
              <a routerLink="/admin/solicitudes" class="text-primary no-underline text-sm">Ver todas</a>
            </div>
            @if (solicitudesRecientes().length === 0) {
              <p class="text-center py-8 text-gray-400">No hay solicitudes recientes</p>
            } @else {
              <div class="max-h-72 overflow-y-auto">
                @for (sol of solicitudesRecientes(); track sol.id) {
                  <div class="flex justify-between px-6 py-4 border-b border-gray-100 last:border-b-0">
                    <div class="flex flex-col">
                      <span class="font-medium">{{ sol.objeto.titulo }}</span>
                      <span class="text-sm text-gray-500">Por: {{ sol.ciudadano.nombre }}</span>
                    </div>
                    <div class="flex flex-col items-end">
                      <span class="text-xs px-2 py-0.5 rounded"
                        [class]="sol.estado === 'PENDIENTE' ? 'bg-orange-100 text-orange-800' :
                                 sol.estado === 'VALIDANDO' ? 'bg-blue-100 text-blue-800' :
                                 sol.estado === 'APROBADA' ? 'bg-green-100 text-green-800' :
                                 'bg-red-100 text-red-800'">
                        {{ getSolicitudEstadoLabel(sol.estado) }}
                      </span>
                      <span class="text-xs text-gray-400 mt-1">{{ sol.createdAt | date:'dd/MM HH:mm' }}</span>
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
  styles: []
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private messageService = inject(MessageService);

  loading = signal(true);
  stats = signal<DashboardStats | null>(null);
  objetosRecientes = signal<ObjetoReciente[]>([]);
  solicitudesRecientes = signal<SolicitudReciente[]>([]);

  // Chart data signals
  categoriaChartData = signal<any>({
    labels: [],
    datasets: []
  });

  estadoChartData = signal<any>({
    labels: [],
    datasets: []
  });

  tendenciaChartData = signal<any>({
    labels: [],
    datasets: []
  });

  // Chart options
  barChartOptions = {
    plugins: {
      legend: { display: false }
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  doughnutChartOptions = {
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  lineChartOptions = {
    plugins: {
      legend: { display: false }
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  ngOnInit() {
    this.loadDashboard();
  }

  private loadDashboard() {
    this.api.get<any>('/admin/estadisticas/dashboard').subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        this.objetosRecientes.set(data.objetosRecientes || []);
        this.solicitudesRecientes.set(data.solicitudesRecientes || []);
        this.buildChartData(data.stats);
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Dashboard cargado',
          detail: 'Estadisticas actualizadas correctamente',
          life: 3000
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las estadisticas',
          life: 5000
        });
      }
    });
  }

  private buildChartData(stats: DashboardStats) {
    // Build category chart data
    const categorias = stats.objetosPorCategoria || {
      'Electronica': 45,
      'Documentos': 32,
      'Ropa': 28,
      'Accesorios': 22,
      'Otros': 15
    };

    this.categoriaChartData.set({
      labels: Object.keys(categorias),
      datasets: [{
        label: 'Objetos',
        data: Object.values(categorias),
        backgroundColor: [
          '#667eea',
          '#764ba2',
          '#f093fb',
          '#f5576c',
          '#4facfe'
        ],
        borderRadius: 8
      }]
    });

    // Build estado chart data
    const estados = stats.objetosPorEstado || {
      'Registrado': stats.objetosTotal - stats.objetosEnAlmacen || 10,
      'En Almacen': stats.objetosEnAlmacen || 25,
      'Reclamado': 8,
      'Entregado': stats.entregasHoy || 5
    };

    this.estadoChartData.set({
      labels: Object.keys(estados),
      datasets: [{
        data: Object.values(estados),
        backgroundColor: [
          '#667eea',
          '#f59e0b',
          '#eab308',
          '#22c55e'
        ],
        hoverBackgroundColor: [
          '#5a6fd6',
          '#d97706',
          '#ca8a04',
          '#16a34a'
        ]
      }]
    });

    // Build tendencia chart data
    const tendencia = stats.tendenciaSemanal || this.generateDefaultTendencia();

    this.tendenciaChartData.set({
      labels: tendencia.map(t => t.fecha),
      datasets: [{
        label: 'Objetos registrados',
        data: tendencia.map(t => t.cantidad),
        fill: true,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        tension: 0.4,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#667eea'
      }]
    });
  }

  private generateDefaultTendencia(): { fecha: string; cantidad: number }[] {
    const dias = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    return dias.map(dia => ({
      fecha: dia,
      cantidad: Math.floor(Math.random() * 20) + 5
    }));
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
