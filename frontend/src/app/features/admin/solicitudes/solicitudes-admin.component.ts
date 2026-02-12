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
import { TextareaModule } from 'primeng/textarea';
import { MessageService, ConfirmationService } from 'primeng/api';

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
    DatePickerModule,
    TextareaModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="p-8">
      <div class="mb-8">
        <h1 class="m-0 text-2xl font-bold text-gray-800">Solicitudes de recuperacion</h1>
      </div>

      <div class="mb-6">
        <p-select
          [(ngModel)]="filtroEstado"
          [options]="estadoOptions"
          placeholder="Todos los estados"
          (onChange)="cargarSolicitudes()"
          [showClear]="true"
          class="w-48"
        />
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-500 bg-white rounded-lg">Cargando solicitudes...</div>
      } @else if (solicitudes().length === 0) {
        <div class="text-center py-12 text-gray-500 bg-white rounded-lg">
          <p>No hay solicitudes {{ filtroEstado ? 'con este estado' : '' }}</p>
        </div>
      } @else {
        <div class="flex flex-col gap-6">
          @for (solicitud of solicitudes(); track solicitud.id) {
            <div class="bg-white rounded-xl shadow-md overflow-hidden"
              [class.border-l-4]="true"
              [class.border-orange-500]="solicitud.estado === 'PENDIENTE'"
              [class.border-blue-500]="solicitud.estado === 'VALIDANDO'"
              [class.border-green-500]="solicitud.estado === 'APROBADA'"
              [class.border-red-500]="solicitud.estado === 'RECHAZADA'"
              [class.border-gray-400]="solicitud.estado === 'ENTREGADA'">
              <div class="flex justify-between items-start p-6 bg-gray-50">
                <div>
                  <span class="text-xs text-gray-400">{{ solicitud.objeto.codigoUnico }}</span>
                  <h3 class="m-0 mt-1 text-lg font-semibold">{{ solicitud.objeto.titulo }}</h3>
                </div>
                <p-tag
                  [value]="solicitud.estado"
                  [severity]="getEstadoSeverity(solicitud.estado)"
                />
              </div>

              <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h4 class="m-0 mb-2 text-sm text-gray-500">Solicitante</h4>
                  <p class="m-0 mb-1 text-sm"><strong>{{ solicitud.ciudadano.nombre }}</strong></p>
                  <p class="m-0 mb-1 text-sm">{{ solicitud.ciudadano.email }}</p>
                  @if (solicitud.ciudadano.telefono) {
                    <p class="m-0 mb-1 text-sm">Tel: {{ solicitud.ciudadano.telefono }}</p>
                  }
                  @if (solicitud.ciudadano.dni) {
                    <p class="m-0 mb-1 text-sm">DNI: {{ solicitud.ciudadano.dni }}</p>
                  }
                </div>

                <div class="md:col-span-2">
                  <p class="m-0 mb-1 text-sm"><strong>Tipo entrega:</strong> {{ solicitud.tipoEntrega === 'PRESENCIAL' ? 'Recogida presencial' : 'Envio a domicilio' }}</p>
                  <p class="m-0 mb-1 text-sm"><strong>Fecha solicitud:</strong> {{ solicitud.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                  @if (solicitud.fechaCita) {
                    <p class="m-0 mb-1 text-sm"><strong>Cita:</strong> {{ solicitud.fechaCita | date:'dd/MM/yyyy HH:mm' }}</p>
                  }
                  @if (solicitud.motivoRechazo) {
                    <p class="m-0 mb-1 text-sm text-red-800"><strong>Motivo rechazo:</strong> {{ solicitud.motivoRechazo }}</p>
                  }
                </div>

                @if (solicitud.documentosAdjuntos && solicitud.documentosAdjuntos.length > 0) {
                  <div class="md:col-span-3 pt-4 border-t border-gray-200">
                    <h4 class="m-0 mb-2 text-sm text-gray-500">Documentos adjuntos</h4>
                    <div class="flex gap-4">
                      @for (doc of solicitud.documentosAdjuntos; track doc) {
                        <a [href]="doc" target="_blank" class="text-primary no-underline text-sm flex items-center gap-1">
                          <i class="pi pi-file"></i> Ver documento
                        </a>
                      }
                    </div>
                  </div>
                }
              </div>

              <div class="flex gap-4 px-6 py-4 bg-gray-50 border-t border-gray-200">
                @switch (solicitud.estado) {
                  @case ('PENDIENTE') {
                    <p-button
                      label="Iniciar validacion"
                      icon="pi pi-check-circle"
                      (onClick)="abrirValidacion(solicitud)"
                    />
                    <p-button
                      label="Rechazar"
                      icon="pi pi-times"
                      severity="danger"
                      (onClick)="abrirRechazo(solicitud)"
                    />
                  }
                  @case ('VALIDANDO') {
                    <p-button
                      label="Aprobar"
                      icon="pi pi-check"
                      severity="success"
                      (onClick)="abrirAprobacion(solicitud)"
                    />
                    <p-button
                      label="Rechazar"
                      icon="pi pi-times"
                      severity="danger"
                      (onClick)="abrirRechazo(solicitud)"
                    />
                  }
                  @case ('APROBADA') {
                    <p-button
                      label="Marcar como entregado"
                      icon="pi pi-box"
                      (onClick)="abrirEntrega(solicitud)"
                    />
                  }
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal Validacion -->
      <p-dialog
        header="Iniciar validacion"
        [(visible)]="dialogValidacion"
        [modal]="true"
        [style]="{width: '450px'}"
      >
        <p class="text-gray-600">Se marcara la solicitud como "En validacion".</p>
        <ng-template pTemplate="footer">
          <p-button label="Cancelar" severity="secondary" (onClick)="cerrarModales()" />
          <p-button
            [label]="procesando() ? 'Procesando...' : 'Confirmar'"
            (onClick)="validar()"
            [disabled]="procesando()"
          />
        </ng-template>
      </p-dialog>

      <!-- Modal Aprobacion -->
      <p-dialog
        header="Aprobar solicitud"
        [(visible)]="dialogAprobacion"
        [modal]="true"
        [style]="{width: '450px'}"
      >
        <div class="mb-4">
          <label class="block mb-2 font-medium">Fecha y hora de cita (opcional)</label>
          <p-datepicker
            [(ngModel)]="fechaCitaDate"
            [showTime]="true"
            dateFormat="dd/mm/yy"
            [showIcon]="true"
            class="w-full"
          />
        </div>
        <ng-template pTemplate="footer">
          <p-button label="Cancelar" severity="secondary" (onClick)="cerrarModales()" />
          <p-button
            [label]="procesando() ? 'Procesando...' : 'Aprobar'"
            severity="success"
            (onClick)="aprobar()"
            [disabled]="procesando()"
          />
        </ng-template>
      </p-dialog>

      <!-- Modal Rechazo -->
      <p-dialog
        header="Rechazar solicitud"
        [(visible)]="dialogRechazo"
        [modal]="true"
        [style]="{width: '450px'}"
      >
        <div class="mb-4">
          <label class="block mb-2 font-medium">Motivo del rechazo *</label>
          <textarea
            pTextarea
            [(ngModel)]="motivoRechazo"
            rows="4"
            placeholder="Explica el motivo del rechazo..."
            class="w-full"
          ></textarea>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="Cancelar" severity="secondary" (onClick)="cerrarModales()" />
          <p-button
            [label]="procesando() ? 'Procesando...' : 'Rechazar'"
            severity="danger"
            (onClick)="rechazar()"
            [disabled]="procesando() || !motivoRechazo"
          />
        </ng-template>
      </p-dialog>

      <!-- Modal Entrega -->
      <p-dialog
        header="Confirmar entrega"
        [(visible)]="dialogEntrega"
        [modal]="true"
        [style]="{width: '450px'}"
      >
        <p class="text-gray-600">Confirma que el objeto ha sido entregado al ciudadano.</p>
        <div class="mb-4 mt-4">
          <label class="block mb-2 font-medium">Observaciones (opcional)</label>
          <textarea
            pTextarea
            [(ngModel)]="observacionesEntrega"
            rows="3"
            placeholder="Notas adicionales..."
            class="w-full"
          ></textarea>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="Cancelar" severity="secondary" (onClick)="cerrarModales()" />
          <p-button
            [label]="procesando() ? 'Procesando...' : 'Confirmar entrega'"
            (onClick)="entregar()"
            [disabled]="procesando()"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: []
})
export class SolicitudesAdminComponent implements OnInit {
  private api = inject(ApiService);
  private messageService = inject(MessageService);

  solicitudes = signal<Solicitud[]>([]);
  loading = signal(true);
  filtroEstado = '';

  estadoOptions = [
    { label: 'Pendientes', value: 'PENDIENTE' },
    { label: 'En validacion', value: 'VALIDANDO' },
    { label: 'Aprobadas', value: 'APROBADA' },
    { label: 'Rechazadas', value: 'RECHAZADA' },
    { label: 'Entregadas', value: 'ENTREGADA' }
  ];

  solicitudActiva: Solicitud | null = null;
  modalValidacion = signal(false);
  modalAprobacion = signal(false);
  modalRechazo = signal(false);
  modalEntrega = signal(false);
  procesando = signal(false);

  dialogValidacion = false;
  dialogAprobacion = false;
  dialogRechazo = false;
  dialogEntrega = false;

  fechaCita = '';
  fechaCitaDate: Date | null = null;
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

  getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      'PENDIENTE': 'warn',
      'VALIDANDO': 'info',
      'APROBADA': 'success',
      'RECHAZADA': 'danger',
      'ENTREGADA': 'secondary'
    };
    return severities[estado] || 'info';
  }

  abrirValidacion(solicitud: Solicitud) {
    this.solicitudActiva = solicitud;
    this.dialogValidacion = true;
  }

  abrirAprobacion(solicitud: Solicitud) {
    this.solicitudActiva = solicitud;
    this.fechaCita = '';
    this.fechaCitaDate = null;
    this.dialogAprobacion = true;
  }

  abrirRechazo(solicitud: Solicitud) {
    this.solicitudActiva = solicitud;
    this.motivoRechazo = '';
    this.dialogRechazo = true;
  }

  abrirEntrega(solicitud: Solicitud) {
    this.solicitudActiva = solicitud;
    this.observacionesEntrega = '';
    this.dialogEntrega = true;
  }

  cerrarModales() {
    this.dialogValidacion = false;
    this.dialogAprobacion = false;
    this.dialogRechazo = false;
    this.dialogEntrega = false;
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
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Solicitud marcada como en validacion'
        });
      },
      error: () => {
        this.procesando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo procesar la solicitud'
        });
      }
    });
  }

  aprobar() {
    if (!this.solicitudActiva) return;
    this.procesando.set(true);

    const data: any = {};
    if (this.fechaCitaDate) {
      data.fechaCita = this.fechaCitaDate.toISOString();
    }

    this.api.put(`/admin/solicitudes/${this.solicitudActiva.id}/validar`, data).subscribe({
      next: () => {
        this.procesando.set(false);
        this.cerrarModales();
        this.cargarSolicitudes();
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Solicitud aprobada correctamente'
        });
      },
      error: () => {
        this.procesando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo aprobar la solicitud'
        });
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
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Solicitud rechazada'
        });
      },
      error: () => {
        this.procesando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo rechazar la solicitud'
        });
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
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Entrega confirmada correctamente'
        });
      },
      error: () => {
        this.procesando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo confirmar la entrega'
        });
      }
    });
  }
}
