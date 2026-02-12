import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService, ConfirmationService } from 'primeng/api';

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
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    TooltipModule,
    DatePickerModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="p-8">
      <div class="mb-8">
        <h1 class="m-0 text-2xl font-bold text-gray-800">Gestion de subastas</h1>
      </div>

      <div class="mb-6">
        <p-select
          [(ngModel)]="filtroEstado"
          [options]="estadoOptions"
          placeholder="Todos los estados"
          (onChange)="cargarSubastas()"
          [showClear]="true"
          class="w-48"
        />
      </div>

      <p-table
        [value]="subastas()"
        [loading]="loading()"
        [paginator]="true"
        [rows]="20"
        [rowsPerPageOptions]="[10, 20, 50]"
        styleClass="p-datatable-striped"
      >
        <ng-template pTemplate="header">
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
        </ng-template>
        <ng-template pTemplate="body" let-subasta>
          <tr>
            <td>
              <div class="flex flex-col">
                <strong>{{ subasta.lote.codigo }}</strong>
                <span class="text-sm text-gray-500">{{ subasta.lote.nombre }}</span>
              </div>
            </td>
            <td>
              <p-tag
                [value]="subasta.estado"
                [severity]="getEstadoSeverity(subasta.estado)"
              />
            </td>
            <td>{{ subasta.precioSalida | currency:'EUR' }}</td>
            <td class="font-semibold text-primary">{{ subasta.precioActual | currency:'EUR' }}</td>
            <td>{{ subasta.totalPujas }}</td>
            <td>{{ subasta.fechaInicio | date:'dd/MM/yyyy HH:mm' }}</td>
            <td>{{ subasta.fechaFin | date:'dd/MM/yyyy HH:mm' }}</td>
            <td>
              @if (subasta.ganador) {
                <div class="flex flex-col">
                  <span>{{ subasta.ganador.nombre }}</span>
                  <small class="text-gray-400 text-xs">{{ subasta.ganador.email }}</small>
                </div>
              } @else {
                <span class="text-gray-400">-</span>
              }
            </td>
            <td>
              <div class="flex gap-1">
                @if (subasta.estado === 'PROGRAMADA') {
                  <p-button
                    icon="pi pi-calendar"
                    [rounded]="true"
                    [text]="true"
                    severity="info"
                    pTooltip="Editar fechas"
                    (onClick)="editarFechas(subasta)"
                  />
                }
                @if (subasta.estado === 'ACTIVA') {
                  <p-button
                    icon="pi pi-times-circle"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    pTooltip="Cerrar subasta"
                    (onClick)="cerrarSubasta(subasta)"
                  />
                }
                @if (subasta.estado === 'CERRADA' && subasta.totalPujas > 0) {
                  <p-button
                    icon="pi pi-check-circle"
                    [rounded]="true"
                    [text]="true"
                    severity="success"
                    pTooltip="Adjudicar"
                    (onClick)="adjudicar(subasta)"
                  />
                }
                <p-button
                  icon="pi pi-eye"
                  [rounded]="true"
                  [text]="true"
                  severity="secondary"
                  pTooltip="Ver detalles"
                  (onClick)="verDetalles(subasta)"
                />
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="9" class="text-center py-8 text-gray-500">
              <p>No hay subastas {{ filtroEstado ? 'con este estado' : '' }}</p>
              <p class="text-sm text-gray-400">Las subastas se crean desde la gestion de lotes</p>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Modal Detalle -->
      <p-dialog
        header="Detalle de subasta"
        [(visible)]="dialogDetalle"
        [modal]="true"
        [style]="{width: '600px'}"
      >
        @if (subastaDetalle()) {
          <div class="mb-6">
            <p class="m-0 mb-2"><strong>Lote:</strong> {{ subastaDetalle()!.lote.codigo }} - {{ subastaDetalle()!.lote.nombre }}</p>
            <p class="m-0 mb-2"><strong>Estado:</strong>
              <p-tag
                [value]="subastaDetalle()!.estado"
                [severity]="getEstadoSeverity(subastaDetalle()!.estado)"
                class="ml-2"
              />
            </p>
            <p class="m-0 mb-2"><strong>Precio salida:</strong> {{ subastaDetalle()!.precioSalida | currency:'EUR' }}</p>
            <p class="m-0 mb-2"><strong>Precio actual:</strong> {{ subastaDetalle()!.precioActual | currency:'EUR' }}</p>
            <p class="m-0 mb-2"><strong>Total pujas:</strong> {{ subastaDetalle()!.totalPujas }}</p>
          </div>

          <h3 class="mt-6 mb-4 text-base font-semibold">Historial de pujas</h3>
          @if (pujas().length === 0) {
            <p class="text-gray-400 text-center py-4">No hay pujas</p>
          } @else {
            <div class="max-h-72 overflow-y-auto">
              @for (puja of pujas(); track puja.id; let i = $index) {
                <div class="flex justify-between p-3 border-b border-gray-200" [class.bg-green-50]="i === 0">
                  <div class="flex flex-col">
                    <span class="font-medium">{{ puja.usuario.nombre }}</span>
                    <span class="text-xs text-gray-500">{{ puja.usuario.email }}</span>
                    <span class="text-xs text-gray-400">{{ puja.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</span>
                  </div>
                  <span class="font-semibold text-primary">{{ puja.cantidad | currency:'EUR' }}</span>
                </div>
              }
            </div>
          }
        }
        <ng-template pTemplate="footer">
          <p-button label="Cerrar" (onClick)="cerrarModal()" />
        </ng-template>
      </p-dialog>

      <!-- Modal Fechas -->
      <p-dialog
        header="Editar fechas"
        [(visible)]="dialogFechas"
        [modal]="true"
        [style]="{width: '450px'}"
      >
        <div class="mb-4">
          <label class="block mb-2 font-medium">Fecha inicio</label>
          <p-datepicker
            [(ngModel)]="fechaInicioDate"
            [showTime]="true"
            dateFormat="dd/mm/yy"
            [showIcon]="true"
            class="w-full"
          />
        </div>

        <div class="mb-4">
          <label class="block mb-2 font-medium">Fecha fin</label>
          <p-datepicker
            [(ngModel)]="fechaFinDate"
            [showTime]="true"
            dateFormat="dd/mm/yy"
            [showIcon]="true"
            class="w-full"
          />
        </div>

        <ng-template pTemplate="footer">
          <p-button label="Cancelar" severity="secondary" (onClick)="cerrarModal()" />
          <p-button
            [label]="guardando() ? 'Guardando...' : 'Guardar'"
            (onClick)="guardarFechas()"
            [disabled]="guardando()"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: []
})
export class SubastasAdminComponent implements OnInit {
  private api = inject(ApiService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  subastas = signal<Subasta[]>([]);
  loading = signal(true);
  guardando = signal(false);
  filtroEstado = '';

  estadoOptions = [
    { label: 'Programadas', value: 'PROGRAMADA' },
    { label: 'Activas', value: 'ACTIVA' },
    { label: 'Cerradas', value: 'CERRADA' },
    { label: 'Adjudicadas', value: 'ADJUDICADA' }
  ];

  dialogDetalle = false;
  dialogFechas = false;
  subastaDetalle = signal<Subasta | null>(null);
  subastaEditar: Subasta | null = null;
  pujas = signal<any[]>([]);

  formFechas = {
    fechaInicio: '',
    fechaFin: ''
  };

  fechaInicioDate: Date | null = null;
  fechaFinDate: Date | null = null;

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

  getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      'PROGRAMADA': 'warn',
      'ACTIVA': 'success',
      'CERRADA': 'secondary',
      'ADJUDICADA': 'info'
    };
    return severities[estado] || 'info';
  }

  verDetalles(subasta: Subasta) {
    this.subastaDetalle.set(subasta);
    this.api.get<any[]>(`/admin/subastas/${subasta.id}/pujas`).subscribe({
      next: (pujas) => this.pujas.set(pujas)
    });
    this.dialogDetalle = true;
  }

  editarFechas(subasta: Subasta) {
    this.subastaEditar = subasta;
    this.fechaInicioDate = new Date(subasta.fechaInicio);
    this.fechaFinDate = new Date(subasta.fechaFin);
    this.dialogFechas = true;
  }

  cerrarModal() {
    this.dialogDetalle = false;
    this.dialogFechas = false;
    this.subastaDetalle.set(null);
    this.subastaEditar = null;
    this.pujas.set([]);
  }

  guardarFechas() {
    if (!this.subastaEditar || !this.fechaInicioDate || !this.fechaFinDate) return;
    this.guardando.set(true);

    const data = {
      fechaInicio: this.fechaInicioDate.toISOString(),
      fechaFin: this.fechaFinDate.toISOString()
    };

    this.api.put(`/admin/subastas/${this.subastaEditar.id}`, data).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarSubastas();
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Fechas actualizadas correctamente'
        });
      },
      error: () => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron actualizar las fechas'
        });
      }
    });
  }

  cerrarSubasta(subasta: Subasta) {
    this.confirmationService.confirm({
      message: '¿Cerrar esta subasta? No se podran realizar mas pujas.',
      header: 'Confirmar cierre',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Si, cerrar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.api.post(`/admin/subastas/${subasta.id}/cerrar`, {}).subscribe({
          next: () => {
            this.cargarSubastas();
            this.messageService.add({
              severity: 'success',
              summary: 'Exito',
              detail: 'Subasta cerrada correctamente'
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo cerrar la subasta'
            });
          }
        });
      }
    });
  }

  adjudicar(subasta: Subasta) {
    this.confirmationService.confirm({
      message: '¿Adjudicar esta subasta al mejor postor?',
      header: 'Confirmar adjudicacion',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Si, adjudicar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.api.post(`/admin/subastas/${subasta.id}/adjudicar`, {}).subscribe({
          next: () => {
            this.cargarSubastas();
            this.messageService.add({
              severity: 'success',
              summary: 'Exito',
              detail: 'Subasta adjudicada correctamente'
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo adjudicar la subasta'
            });
          }
        });
      }
    });
  }
}
