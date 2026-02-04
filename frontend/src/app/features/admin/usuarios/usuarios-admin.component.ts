import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

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
  imports: [CommonModule, FormsModule],
  template: `
    <div class="usuarios-container">
      <div class="header">
        <h1>Gestion de usuarios</h1>
        <button class="btn btn-primary" (click)="abrirModal()">
          + Nuevo usuario
        </button>
      </div>

      <div class="filtros">
        <input
          type="text"
          [(ngModel)]="busqueda"
          placeholder="Buscar por nombre o email..."
          (keyup.enter)="cargarUsuarios()"
        >
        <select [(ngModel)]="filtroTipo" (change)="cargarUsuarios()">
          <option value="">Todos los tipos</option>
          <option value="CIUDADANO">Ciudadano</option>
          <option value="ADMIN_MUNICIPAL">Admin municipal</option>
          <option value="ADMIN_EXTERNO">Admin externo</option>
          <option value="LOGISTICA">Logistica</option>
          @if (authService.isSuperAdmin()) {
            <option value="SUPERADMIN">Superadmin</option>
          }
        </select>
        <button class="btn btn-outline" (click)="cargarUsuarios()">Buscar</button>
      </div>

      @if (loading()) {
        <div class="loading">Cargando usuarios...</div>
      } @else if (usuarios().length === 0) {
        <div class="empty-state">
          <p>No se encontraron usuarios</p>
        </div>
      } @else {
        <div class="tabla-container">
          <table class="tabla">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Tipo</th>
                <th>Telefono</th>
                <th>DNI</th>
                <th>Estado</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (usuario of usuarios(); track usuario.id) {
                <tr [class.inactivo]="!usuario.activo">
                  <td>
                    <div class="usuario-cell">
                      <strong>{{ usuario.nombre }} {{ usuario.apellidos }}</strong>
                      <span>{{ usuario.email }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="tipo-badge" [class]="'tipo-' + usuario.tipo.toLowerCase()">
                      {{ getTipoLabel(usuario.tipo) }}
                    </span>
                  </td>
                  <td>{{ usuario.telefono || '-' }}</td>
                  <td>{{ usuario.dni || '-' }}</td>
                  <td>
                    <div class="estados">
                      @if (usuario.activo) {
                        <span class="estado-badge activo">Activo</span>
                      } @else {
                        <span class="estado-badge inactivo">Inactivo</span>
                      }
                      @if (!usuario.emailVerificado) {
                        <span class="estado-badge pendiente">Email no verificado</span>
                      }
                    </div>
                  </td>
                  <td>{{ usuario.createdAt | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <div class="acciones">
                      <button class="btn-icon" (click)="editarUsuario(usuario)" title="Editar">
                        ✏️
                      </button>
                      <button
                        class="btn-icon"
                        (click)="toggleActivo(usuario)"
                        [title]="usuario.activo ? 'Desactivar' : 'Activar'"
                      >
                        {{ usuario.activo ? '🔒' : '🔓' }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (modalUsuario()) {
        <div class="modal-overlay" (click)="cerrarModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>{{ usuarioEditar ? 'Editar' : 'Nuevo' }} usuario</h2>

            <div class="form-row">
              <div class="form-group">
                <label>Nombre *</label>
                <input type="text" [(ngModel)]="formUsuario.nombre">
              </div>
              <div class="form-group">
                <label>Apellidos</label>
                <input type="text" [(ngModel)]="formUsuario.apellidos">
              </div>
            </div>

            <div class="form-group">
              <label>Email *</label>
              <input type="email" [(ngModel)]="formUsuario.email" [disabled]="!!usuarioEditar">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Telefono</label>
                <input type="tel" [(ngModel)]="formUsuario.telefono">
              </div>
              <div class="form-group">
                <label>DNI</label>
                <input type="text" [(ngModel)]="formUsuario.dni">
              </div>
            </div>

            <div class="form-group">
              <label>Tipo de usuario *</label>
              <select [(ngModel)]="formUsuario.tipo">
                <option value="CIUDADANO">Ciudadano</option>
                <option value="ADMIN_MUNICIPAL">Admin municipal</option>
                <option value="ADMIN_EXTERNO">Admin externo</option>
                <option value="LOGISTICA">Logistica</option>
                @if (authService.isSuperAdmin()) {
                  <option value="SUPERADMIN">Superadmin</option>
                }
              </select>
            </div>

            @if (!usuarioEditar) {
              <div class="form-group">
                <label>Contrasena *</label>
                <input type="password" [(ngModel)]="formUsuario.password" minlength="8">
                <small>Minimo 8 caracteres</small>
              </div>
            }

            <div class="form-group checkbox">
              <label>
                <input type="checkbox" [(ngModel)]="formUsuario.activo">
                Usuario activo
              </label>
            </div>

            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }

            <div class="modal-acciones">
              <button class="btn btn-outline" (click)="cerrarModal()">Cancelar</button>
              <button class="btn btn-primary" (click)="guardarUsuario()" [disabled]="guardando()">
                {{ guardando() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .usuarios-container {
      padding: 2rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h1 { margin: 0; }

    .filtros {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .filtros input {
      flex: 1;
      max-width: 300px;
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .filtros select {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .loading, .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;
      background: white;
      border-radius: 8px;
    }

    .tabla-container {
      background: white;
      border-radius: 8px;
      overflow-x: auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .tabla {
      width: 100%;
      border-collapse: collapse;
    }

    .tabla th, .tabla td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .tabla th {
      background: #f9f9f9;
      font-weight: 600;
      font-size: 0.875rem;
      color: #666;
    }

    tr.inactivo {
      opacity: 0.5;
    }

    .usuario-cell {
      display: flex;
      flex-direction: column;
    }

    .usuario-cell span {
      font-size: 0.875rem;
      color: #666;
    }

    .tipo-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .tipo-ciudadano { background: #e3f2fd; color: #1976d2; }
    .tipo-admin_municipal { background: #e8f5e9; color: #388e3c; }
    .tipo-admin_externo { background: #fff3e0; color: #f57c00; }
    .tipo-logistica { background: #fce4ec; color: #c2185b; }
    .tipo-superadmin { background: #f3e5f5; color: #7b1fa2; }

    .estados {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .estado-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 500;
      display: inline-block;
    }

    .estado-badge.activo { background: #e8f5e9; color: #388e3c; }
    .estado-badge.inactivo { background: #ffebee; color: #c62828; }
    .estado-badge.pendiente { background: #fff9c4; color: #f9a825; }

    .acciones {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      opacity: 0.6;
    }

    .btn-icon:hover { opacity: 1; }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-primary { background: #667eea; color: white; }
    .btn-outline { background: white; border: 1px solid #ddd; }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
    }

    .modal h2 { margin: 0 0 1.5rem; }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-group.checkbox label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: normal;
    }

    .form-group input, .form-group select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
    }

    .form-group input:disabled {
      background: #f5f5f5;
    }

    .form-group small {
      display: block;
      margin-top: 0.25rem;
      color: #999;
      font-size: 0.75rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .modal-acciones {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }
  `]
})
export class UsuariosAdminComponent implements OnInit {
  private api = inject(ApiService);
  authService = inject(AuthService);

  usuarios = signal<Usuario[]>([]);
  loading = signal(true);
  guardando = signal(false);
  error = signal('');

  busqueda = '';
  filtroTipo = '';

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
    this.modalUsuario.set(true);
  }

  editarUsuario(usuario: Usuario) {
    this.abrirModal(usuario);
  }

  cerrarModal() {
    this.modalUsuario.set(false);
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
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err.message || 'Error al guardar');
      }
    });
  }

  toggleActivo(usuario: Usuario) {
    const accion = usuario.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} a ${usuario.nombre}?`)) return;

    this.api.put(`/admin/usuarios/${usuario.id}`, { activo: !usuario.activo }).subscribe({
      next: () => this.cargarUsuarios()
    });
  }
}
