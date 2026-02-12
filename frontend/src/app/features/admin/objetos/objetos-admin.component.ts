import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

interface Objeto {
  id: number;
  codigoUnico: string;
  titulo: string;
  tipo: string;
  estado: string;
  categoria?: { nombre: string };
  ubicacionAlmacen?: { codigo: string };
  createdAt: string;
  fotoPrincipal?: { thumbnailUrl: string };
}

@Component({
  selector: 'app-objetos-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="p-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="m-0 text-2xl font-bold text-gray-800">Gestion de objetos</h1>
        <a routerLink="/admin/objetos/nuevo">
          <p-button label="Nuevo objeto" icon="pi pi-plus" />
        </a>
      </div>

      <div class="bg-white rounded-xl shadow-md overflow-hidden">
        <p-table
          [value]="objetos()"
          [loading]="loading()"
          [paginator]="true"
          [rows]="20"
          [totalRecords]="totalRegistros()"
          [lazy]="true"
          (onLazyLoad)="cargarDatos($event)"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} objetos"
          [rowsPerPageOptions]="[10, 20, 50]"
          styleClass="p-datatable-sm"
          [globalFilterFields]="['titulo', 'codigoUnico']"
        >
          <ng-template pTemplate="caption">
            <div class="flex flex-wrap gap-4 items-center justify-between">
              <div class="flex gap-4 flex-wrap items-center">
                <p-iconfield iconPosition="left">
                  <p-inputicon styleClass="pi pi-search" />
                  <input
                    pInputText
                    type="text"
                    [(ngModel)]="filtros.busqueda"
                    placeholder="Buscar..."
                    (keyup.enter)="buscar()"
                    class="w-64"
                  />
                </p-iconfield>

                <p-select
                  [(ngModel)]="filtros.tipo"
                  [options]="tiposOptions"
                  placeholder="Tipo"
                  (onChange)="buscar()"
                  [showClear]="true"
                  class="w-40"
                />

                <p-select
                  [(ngModel)]="filtros.estado"
                  [options]="estadosOptions"
                  placeholder="Estado"
                  (onChange)="buscar()"
                  [showClear]="true"
                  class="w-44"
                />
              </div>

              <p-button
                label="Buscar"
                icon="pi pi-search"
                severity="secondary"
                (onClick)="buscar()"
              />
            </div>
          </ng-template>

          <ng-template pTemplate="header">
            <tr>
              <th>Objeto</th>
              <th>Codigo</th>
              <th>Tipo</th>
              <th>Categoria</th>
              <th>Estado</th>
              <th>Ubicacion</th>
              <th pSortableColumn="createdAt">Fecha <p-sortIcon field="createdAt" /></th>
              <th>Acciones</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-objeto>
            <tr>
              <td class="min-w-52">
                <div class="flex items-center gap-3">
                  @if (objeto.fotoPrincipal) {
                    <img [src]="objeto.fotoPrincipal.thumbnailUrl" [alt]="objeto.titulo" class="w-10 h-10 rounded object-cover">
                  } @else {
                    <div class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-lg">📦</div>
                  }
                  <span class="font-medium">{{ objeto.titulo }}</span>
                </div>
              </td>
              <td>
                <code class="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{{ objeto.codigoUnico }}</code>
              </td>
              <td>
                <p-tag
                  [value]="objeto.tipo"
                  [severity]="objeto.tipo === 'ENCONTRADO' ? 'success' : 'danger'"
                />
              </td>
              <td>{{ objeto.categoria?.nombre || '-' }}</td>
              <td>
                <p-tag
                  [value]="objeto.estado"
                  [severity]="getEstadoSeverity(objeto.estado)"
                />
              </td>
              <td>
                @if (objeto.ubicacionAlmacen?.codigo) {
                  <span class="text-sm">{{ objeto.ubicacionAlmacen.codigo }}</span>
                } @else {
                  <span class="text-gray-400">-</span>
                }
              </td>
              <td>{{ objeto.createdAt | date:'dd/MM/yyyy' }}</td>
              <td>
                <div class="flex gap-1">
                  <a [routerLink]="['/admin/objetos', objeto.id]">
                    <p-button
                      icon="pi pi-pencil"
                      [rounded]="true"
                      [text]="true"
                      severity="info"
                      pTooltip="Editar"
                    />
                  </a>
                  <p-button
                    icon="pi pi-qrcode"
                    [rounded]="true"
                    [text]="true"
                    severity="secondary"
                    pTooltip="Generar QR"
                    (onClick)="generarQR(objeto)"
                  />
                  <p-button
                    icon="pi pi-trash"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    pTooltip="Eliminar"
                    (onClick)="confirmarEliminar(objeto)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="text-center py-12">
                <div class="text-gray-500">
                  <i class="pi pi-inbox text-4xl mb-4 block"></i>
                  <p>No se encontraron objetos</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: []
})
export class ObjetosAdminComponent implements OnInit {
  private api = inject(ApiService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  objetos = signal<Objeto[]>([]);
  loading = signal(true);
  pagina = signal(1);
  totalRegistros = signal(0);

  filtros = {
    busqueda: '',
    tipo: null as string | null,
    estado: null as string | null
  };

  tiposOptions = [
    { label: 'Encontrado', value: 'ENCONTRADO' },
    { label: 'Perdido', value: 'PERDIDO' }
  ];

  estadosOptions = [
    { label: 'Registrado', value: 'REGISTRADO' },
    { label: 'En almacen', value: 'EN_ALMACEN' },
    { label: 'Reclamado', value: 'RECLAMADO' },
    { label: 'Entregado', value: 'ENTREGADO' },
    { label: 'Subasta', value: 'SUBASTA' },
    { label: 'Donado', value: 'DONADO' }
  ];

  ngOnInit() {
    this.buscar();
  }

  cargarDatos(event: any) {
    this.pagina.set(Math.floor(event.first / event.rows) + 1);
    this.buscar();
  }

  buscar() {
    this.loading.set(true);
    const params = new URLSearchParams();
    if (this.filtros.busqueda) params.append('q', this.filtros.busqueda);
    if (this.filtros.tipo) params.append('tipo', this.filtros.tipo);
    if (this.filtros.estado) params.append('estado', this.filtros.estado);
    params.append('page', this.pagina().toString());

    this.api.get<any>(`/admin/objetos?${params}`).subscribe({
      next: (response) => {
        this.objetos.set(response.data || []);
        this.totalRegistros.set(response.meta?.total || 0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los objetos'
        });
      }
    });
  }

  getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      'REGISTRADO': 'info',
      'EN_ALMACEN': 'warn',
      'RECLAMADO': 'warn',
      'ENTREGADO': 'success',
      'SUBASTA': 'secondary',
      'DONADO': 'secondary'
    };
    return severities[estado] || 'info';
  }

  generarQR(objeto: Objeto) {
    this.api.post(`/admin/objetos/${objeto.id}/qr`, {}).subscribe({
      next: (response: any) => {
        if (response.qrUrl) {
          window.open(response.qrUrl, '_blank');
        }
        this.messageService.add({
          severity: 'success',
          summary: 'QR Generado',
          detail: 'El codigo QR se ha generado correctamente'
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Error al generar QR'
        });
      }
    });
  }

  confirmarEliminar(objeto: Objeto) {
    this.confirmationService.confirm({
      message: `¿Seguro que quieres eliminar "${objeto.titulo}"?`,
      header: 'Confirmar eliminacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminar(objeto)
    });
  }

  eliminar(objeto: Objeto) {
    this.api.delete(`/admin/objetos/${objeto.id}`).subscribe({
      next: () => {
        this.objetos.set(this.objetos().filter(o => o.id !== objeto.id));
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Objeto eliminado correctamente'
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Error al eliminar'
        });
      }
    });
  }
}
