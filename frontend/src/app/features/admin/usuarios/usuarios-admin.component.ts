import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellidos?: string;
  telefono?: string;
  dni?: string;
  tipo: string;
  activo: boolean;
  emailVerificado: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-usuarios-admin',
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
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="p-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="m-0 text-2xl font-bold text-gray-800">Gestion de usuarios</h1>
        <p-button label="Nuevo usuario" icon="pi pi-plus" (onClick)="abrirModal()" />
      </div>

      <div class="flex gap-4 mb-6">
        <p-iconfield>
          <p-inputicon styleClass="pi pi-search" />
          <input
            type="text"
            pInputText
            [(ngModel)]="busqueda"
            placeholder="Buscar por nombre o email..."
            (keyup.enter)="cargarUsuarios()"
            class="w-72"
          />
        </p-iconfield>
        <p-select
          [(ngModel)]="filtroTipo"
          [options]="tipoOptions"
          placeholder="Todos los tipos"
          (onChange)="cargarUsuarios()"
          [showClear]="true"
          class="w-48"
        />
        <p-button label="Buscar" icon="pi pi-search" severity="secondary" (onClick)="cargarUsuarios()" />
      </div>

      <p-table
        [value]="usuarios()"
        [loading]="loading()"
        [paginator]="true"
        [rows]="20"
        [rowsPerPageOptions]="[10, 20, 50]"
        styleClass="p-datatable-striped"
      >
        <ng-template pTemplate="header">
          <tr>
            <th>Usuario</th>
            <th>Tipo</th>
            <th>Telefono</th>
            <th>DNI</th>
            <th>Estado</th>
            <th>Registro</th>
            <th>Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-usuario>
          <tr [class.opacity-50]="!usuario.activo">
            <td>
              <div class="flex flex-col">
                <strong>{{ usuario.nombre }} {{ usuario.apellidos }}</strong>
                <span class="text-sm text-gray-500">{{ usuario.email }}</span>
              </div>
            </td>
            <td>
              <p-tag
                [value]="getTipoLabel(usuario.tipo)"
                [severity]="getTipoSeverity(usuario.tipo)"
              />
            </td>
            <td>{{ usuario.telefono || '-' }}</td>
            <td>{{ usuario.dni || '-' }}</td>
            <td>
              <div class="flex flex-col gap-1">
                <p-tag
                  [value]="usuario.activo ? 'Activo' : 'Inactivo'"
                  [severity]="usuario.activo ? 'success' : 'danger'"
                />
                @if (!usuario.emailVerificado) {
                  <p-tag value="Email no verificado" severity="warn" />
                }
              </div>
            </td>
            <td>{{ usuario.createdAt | date:'dd/MM/yyyy' }}</td>
            <td>
              <div class="flex gap-1">
                <p-button
                  icon="pi pi-pencil"
                  [rounded]="true"
                  [text]="true"
                  severity="info"
                  pTooltip="Editar"
                  (onClick)="editarUsuario(usuario)"
                />
                <p-button
                  [icon]="usuario.activo ? 'pi pi-lock' : 'pi pi-lock-open'"
                  [rounded]="true"
                  [text]="true"
                  [severity]="usuario.activo ? 'warn' : 'success'"
                  [pTooltip]="usuario.activo ? 'Desactivar' : 'Activar'"
                  (onClick)="toggleActivo(usuario)"
                />
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="text-center py-8 text-gray-500">
              No se encontraron usuarios
            </td>
          </tr>
        </ng-template>
      </p-table>

      <p-dialog
        [header]="usuarioEditar ? 'Editar usuario' : 'Nuevo usuario'"
        [(visible)]="dialogVisible"
        [modal]="true"
        [style]="{width: '600px'}"
        [closable]="true"
      >
        <div class="grid grid-cols-2 gap-4">
          <div class="mb-4">
            <label class="block mb-2 font-medium">Nombre *</label>
            <input type="text" pInputText [(ngModel)]="formUsuario.nombre" class="w-full" />
          </div>
          <div class="mb-4">
            <label class="block mb-2 font-medium">Apellidos</label>
            <input type="text" pInputText [(ngModel)]="formUsuario.apellidos" class="w-full" />
          </div>
        </div>

        <div class="mb-4">
          <label class="block mb-2 font-medium">Email *</label>
          <input type="email" pInputText [(ngModel)]="formUsuario.email" [disabled]="!!usuarioEditar" class="w-full" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="mb-4">
            <label class="block mb-2 font-medium">Telefono</label>
            <input type="tel" pInputText [(ngModel)]="formUsuario.telefono" class="w-full" />
          </div>
          <div class="mb-4">
            <label class="block mb-2 font-medium">DNI</label>
            <input type="text" pInputText [(ngModel)]="formUsuario.dni" class="w-full" />
          </div>
        </div>

        <div class="mb-4">
          <label class="block mb-2 font-medium">Tipo de usuario *</label>
          <p-select
            [(ngModel)]="formUsuario.tipo"
            [options]="tipoOptionsForm"
            class="w-full"
          />
        </div>

        @if (!usuarioEditar) {
          <div class="mb-4">
            <label class="block mb-2 font-medium">Contrasena *</label>
            <input type="password" pInputText [(ngModel)]="formUsuario.password" minlength="8" class="w-full" />
            <small class="block mt-1 text-gray-400 text-xs">Minimo 8 caracteres</small>
          </div>
        }

        <div class="mb-4">
          <label class="flex items-center gap-2 font-normal cursor-pointer">
            <input type="checkbox" [(ngModel)]="formUsuario.activo" />
            Usuario activo
          </label>
        </div>

        @if (error()) {
          <div class="bg-red-50 text-red-800 p-3 rounded mb-4">{{ error() }}</div>
        }

        <ng-template pTemplate="footer">
          <p-button label="Cancelar" severity="secondary" (onClick)="cerrarModal()" />
          <p-button
            [label]="guardando() ? 'Guardando...' : 'Guardar'"
            (onClick)="guardarUsuario()"
            [disabled]="guardando()"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: []
})
export class UsuariosAdminComponent implements OnInit {
  private api = inject(ApiService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  authService = inject(AuthService);

  usuarios = signal<Usuario[]>([]);
  loading = signal(true);
  guardando = signal(false);
  error = signal('');

  busqueda = '';
  filtroTipo = '';
  dialogVisible = false;

  tipoOptions = [
    { label: 'Ciudadano', value: 'CIUDADANO' },
    { label: 'Admin municipal', value: 'ADMIN_MUNICIPAL' },
    { label: 'Admin externo', value: 'ADMIN_EXTERNO' },
    { label: 'Logistica', value: 'LOGISTICA' }
  ];

  get tipoOptionsForm() {
    const options = [...this.tipoOptions];
    if (this.authService.isSuperAdmin()) {
      options.push({ label: 'Superadmin', value: 'SUPERADMIN' });
    }
    return options;
  }

  modalUsuario = signal(false);
  usuarioEditar: Usuario | null = null;

  formUsuario = {
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    dni: '',
    tipo: 'CIUDADANO',
    password: '',
    activo: true
  };

  ngOnInit() {
    if (this.authService.isSuperAdmin()) {
      this.tipoOptions.push({ label: 'Superadmin', value: 'SUPERADMIN' });
    }
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.loading.set(true);
    let url = '/admin/usuarios?';
    if (this.busqueda) url += `q=${this.busqueda}&`;
    if (this.filtroTipo) url += `tipo=${this.filtroTipo}`;

    this.api.get<Usuario[]>(url).subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      'CIUDADANO': 'Ciudadano',
      'ADMIN_MUNICIPAL': 'Admin municipal',
      'ADMIN_EXTERNO': 'Admin externo',
      'LOGISTICA': 'Logistica',
      'SUPERADMIN': 'Superadmin'
    };
    return labels[tipo] || tipo;
  }

  getTipoSeverity(tipo: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      'CIUDADANO': 'info',
      'ADMIN_MUNICIPAL': 'success',
      'ADMIN_EXTERNO': 'warn',
      'LOGISTICA': 'secondary',
      'SUPERADMIN': 'contrast'
    };
    return severities[tipo] || 'info';
  }

  abrirModal(usuario?: Usuario) {
    this.usuarioEditar = usuario || null;
    this.error.set('');
    this.formUsuario = usuario
      ? {
          nombre: usuario.nombre,
          apellidos: usuario.apellidos || '',
          email: usuario.email,
          telefono: usuario.telefono || '',
          dni: usuario.dni || '',
          tipo: usuario.tipo,
          password: '',
          activo: usuario.activo
        }
      : {
          nombre: '',
          apellidos: '',
          email: '',
          telefono: '',
          dni: '',
          tipo: 'CIUDADANO',
          password: '',
          activo: true
        };
    this.dialogVisible = true;
  }

  editarUsuario(usuario: Usuario) {
    this.abrirModal(usuario);
  }

  cerrarModal() {
    this.dialogVisible = false;
    this.usuarioEditar = null;
  }

  guardarUsuario() {
    this.error.set('');

    if (!this.formUsuario.nombre || !this.formUsuario.email) {
      this.error.set('Nombre y email son obligatorios');
      return;
    }

    if (!this.usuarioEditar && this.formUsuario.password.length < 8) {
      this.error.set('La contrasena debe tener al menos 8 caracteres');
      return;
    }

    this.guardando.set(true);

    const data: any = { ...this.formUsuario };
    if (this.usuarioEditar) {
      delete data.password;
      delete data.email;
    }

    const request = this.usuarioEditar
      ? this.api.put(`/admin/usuarios/${this.usuarioEditar.id}`, data)
      : this.api.post('/admin/usuarios', data);

    request.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarUsuarios();
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: this.usuarioEditar ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente'
        });
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err.message || 'Error al guardar');
      }
    });
  }

  toggleActivo(usuario: Usuario) {
    const accion = usuario.activo ? 'desactivar' : 'activar';

    this.confirmationService.confirm({
      message: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} a ${usuario.nombre}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Si',
      rejectLabel: 'No',
      accept: () => {
        this.api.put(`/admin/usuarios/${usuario.id}`, { activo: !usuario.activo }).subscribe({
          next: () => {
            this.cargarUsuarios();
            this.messageService.add({
              severity: 'success',
              summary: 'Exito',
              detail: `Usuario ${accion}do correctamente`
            });
          }
        });
      }
    });
  }
}
