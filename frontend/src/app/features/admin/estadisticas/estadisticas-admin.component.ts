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
    <div class="p-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="m-0 text-2xl font-bold text-gray-800">Estadisticas</h1>
        <div>
          <select [(ngModel)]="periodo" (change)="cargarEstadisticas()" class="px-4 py-2 border border-gray-300 rounded text-sm">
            <option value="mes">Este mes</option>
            <option value="trimestre">Ultimo trimestre</option>
            <option value="ano">Este ano</option>
            <option value="todo">Todo el tiempo</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-500">Cargando estadisticas...</div>
      } @else if (stats()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white p-6 rounded-xl shadow-md flex gap-4 items-center">
            <div class="text-3xl w-14 h-14 flex items-center justify-center bg-gray-100 rounded-xl">📦</div>
            <div class="flex flex-col">
              <span class="text-3xl font-bold">{{ stats()!.resumen.objetosTotal }}</span>
              <span class="text-sm text-gray-500">Objetos totales</span>
              <span class="text-xs text-green-500">+{{ stats()!.resumen.objetosEsteMes }} este mes</span>
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-md flex gap-4 items-center">
            <div class="text-3xl w-14 h-14 flex items-center justify-center bg-gray-100 rounded-xl">📋</div>
            <div class="flex flex-col">
              <span class="text-3xl font-bold">{{ stats()!.resumen.solicitudesTotal }}</span>
              <span class="text-sm text-gray-500">Solicitudes totales</span>
              <span class="text-xs text-green-500">+{{ stats()!.resumen.solicitudesEsteMes }} este mes</span>
            </div>
          </div>

          <div class="bg-gradient-to-br from-primary to-purple-600 p-6 rounded-xl shadow-md flex gap-4 items-center text-white">
            <div class="text-3xl w-14 h-14 flex items-center justify-center bg-white/20 rounded-xl">✅</div>
            <div class="flex flex-col">
              <span class="text-3xl font-bold">{{ stats()!.resumen.tasaRecuperacion }}%</span>
              <span class="text-sm text-white/80">Tasa de recuperacion</span>
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-md flex gap-4 items-center">
            <div class="text-3xl w-14 h-14 flex items-center justify-center bg-gray-100 rounded-xl">⏱️</div>
            <div class="flex flex-col">
              <span class="text-3xl font-bold">{{ stats()!.resumen.tiempoPromedioEntrega }}</span>
              <span class="text-sm text-gray-500">Dias promedio entrega</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="m-0 mb-6 text-base font-semibold">Objetos por estado</h3>
            <div class="flex flex-col gap-3">
              @for (item of stats()!.objetosPorEstado; track item.estado) {
                <div class="flex items-center gap-3">
                  <span class="w-24 text-sm text-ellipsis overflow-hidden whitespace-nowrap">{{ item.estado }}</span>
                  <div class="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      class="h-full rounded transition-all duration-500"
                      [style.width.%]="getPercentage(item.cantidad, stats()!.objetosPorEstado)"
                      [class]="item.estado === 'REGISTRADO' ? 'bg-blue-500' :
                               item.estado === 'EN_ALMACEN' ? 'bg-orange-500' :
                               item.estado === 'RECLAMADO' ? 'bg-yellow-500' :
                               item.estado === 'ENTREGADO' ? 'bg-green-500' :
                               'bg-purple-500'"
                    ></div>
                  </div>
                  <span class="w-12 text-right font-semibold text-gray-500">{{ item.cantidad }}</span>
                </div>
              }
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="m-0 mb-6 text-base font-semibold">Objetos por categoria</h3>
            <div class="flex flex-col gap-3">
              @for (item of stats()!.objetosPorCategoria.slice(0, 8); track item.categoria) {
                <div class="flex items-center gap-3">
                  <span class="w-24 text-sm text-ellipsis overflow-hidden whitespace-nowrap">{{ item.categoria }}</span>
                  <div class="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      class="h-full bg-primary rounded transition-all duration-500"
                      [style.width.%]="getPercentage(item.cantidad, stats()!.objetosPorCategoria)"
                    ></div>
                  </div>
                  <span class="w-12 text-right font-semibold text-gray-500">{{ item.cantidad }}</span>
                </div>
              }
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-md lg:col-span-2">
            <h3 class="m-0 mb-6 text-base font-semibold">Objetos registrados por mes</h3>
            <div class="flex gap-2 items-end h-52 pt-4">
              @for (item of stats()!.objetosPorMes; track item.mes) {
                <div class="flex-1 flex flex-col items-center">
                  <div class="h-36 w-full flex items-end">
                    <div
                      class="w-full bg-gradient-to-t from-primary to-purple-600 rounded-t min-h-1 transition-all duration-500"
                      [style.height.%]="getPercentage(item.cantidad, stats()!.objetosPorMes)"
                    ></div>
                  </div>
                  <span class="text-xs text-gray-400 mt-2">{{ item.mes }}</span>
                  <span class="text-xs font-semibold text-primary">{{ item.cantidad }}</span>
                </div>
              }
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="m-0 mb-6 text-base font-semibold">Solicitudes por estado</h3>
            <div class="flex flex-col gap-3">
              @for (item of stats()!.solicitudesPorEstado; track item.estado) {
                <div class="flex items-center gap-3">
                  <span class="w-4 h-4 rounded"
                    [class]="item.estado === 'PENDIENTE' ? 'bg-orange-500' :
                             item.estado === 'VALIDANDO' ? 'bg-blue-500' :
                             item.estado === 'APROBADA' ? 'bg-green-500' :
                             item.estado === 'RECHAZADA' ? 'bg-red-500' :
                             'bg-gray-400'"
                  ></span>
                  <span class="flex-1 text-sm">{{ item.estado }}</span>
                  <span class="font-semibold text-gray-500">{{ item.cantidad }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
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
