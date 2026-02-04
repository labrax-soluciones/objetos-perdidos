import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

interface Alerta {
  id: number;
  criterios: {
    categoriaId?: number;
    categoria?: string;
    color?: string;
    zona?: string;
    palabrasClave?: string;
  };
  activa: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="perfil-container">
      <div class="perfil-header">
        <h1>Mi perfil</h1>
      </div>

      <div class="perfil-content">
        <div class="perfil-card">
          <h2>Datos personales</h2>

          @if (successDatos()) {
            <div class="success-message">{{ successDatos() }}</div>
          }
          @if (errorDatos()) {
            <div class="error-message">{{ errorDatos() }}</div>
          }

          <form (ngSubmit)="guardarDatos()">
            <div class="form-row">
              <div class="form-group">
                <label for="nombre">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  [(ngModel)]="datosPersonales.nombre"
                  name="nombre"
                  required
                >
              </div>
              <div class="form-group">
                <label for="apellidos">Apellidos</label>
                <input
                  type="text"
                  id="apellidos"
                  [(ngModel)]="datosPersonales.apellidos"
                  name="apellidos"
                >
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="datosPersonales.email"
                name="email"
                disabled
              >
              <small>El email no se puede cambiar</small>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="telefono">Telefono</label>
                <input
                  type="tel"
                  id="telefono"
                  [(ngModel)]="datosPersonales.telefono"
                  name="telefono"
                >
              </div>
              <div class="form-group">
                <label for="dni">DNI/NIE</label>
                <input
                  type="text"
                  id="dni"
                  [(ngModel)]="datosPersonales.dni"
                  name="dni"
                >
              </div>
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="guardandoDatos()">
              {{ guardandoDatos() ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </form>
        </div>

        <div class="perfil-card">
          <h2>Cambiar contrasena</h2>

          @if (successPassword()) {
            <div class="success-message">{{ successPassword() }}</div>
          }
          @if (errorPassword()) {
            <div class="error-message">{{ errorPassword() }}</div>
          }

          <form (ngSubmit)="cambiarPassword()">
            <div class="form-group">
              <label for="currentPassword">Contrasena actual</label>
              <input
                type="password"
                id="currentPassword"
                [(ngModel)]="passwordData.currentPassword"
                name="currentPassword"
                required
              >
            </div>

            <div class="form-group">
              <label for="newPassword">Nueva contrasena</label>
              <input
                type="password"
                id="newPassword"
                [(ngModel)]="passwordData.newPassword"
                name="newPassword"
                required
                minlength="8"
              >
              <small>Minimo 8 caracteres</small>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmar contrasena</label>
              <input
                type="password"
                id="confirmPassword"
                [(ngModel)]="passwordData.confirmPassword"
                name="confirmPassword"
                required
              >
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="guardandoPassword()">
              {{ guardandoPassword() ? 'Guardando...' : 'Cambiar contrasena' }}
            </button>
          </form>
        </div>

        <div class="perfil-card">
          <h2>Mis alertas</h2>
          <p class="descripcion">Recibe notificaciones cuando aparezcan objetos que coincidan con tus criterios.</p>

          @if (loadingAlertas()) {
            <div class="loading">Cargando alertas...</div>
          } @else {
            @if (alertas().length === 0) {
              <p class="no-alertas">No tienes alertas configuradas</p>
            } @else {
              <div class="alertas-lista">
                @for (alerta of alertas(); track alerta.id) {
                  <div class="alerta-item" [class.inactiva]="!alerta.activa">
                    <div class="alerta-info">
                      <div class="alerta-criterios">
                        @if (alerta.criterios.categoria) {
                          <span class="criterio">{{ alerta.criterios.categoria }}</span>
                        }
                        @if (alerta.criterios.color) {
                          <span class="criterio">Color: {{ alerta.criterios.color }}</span>
                        }
                        @if (alerta.criterios.zona) {
                          <span class="criterio">Zona: {{ alerta.criterios.zona }}</span>
                        }
                        @if (alerta.criterios.palabrasClave) {
                          <span class="criterio">"{{ alerta.criterios.palabrasClave }}"</span>
                        }
                      </div>
                      <span class="alerta-fecha">Creada: {{ alerta.createdAt | date:'dd/MM/yyyy' }}</span>
                    </div>
                    <div class="alerta-acciones">
                      <button
                        class="btn-icon"
                        [class.activa]="alerta.activa"
                        (click)="toggleAlerta(alerta)"
                        [title]="alerta.activa ? 'Desactivar' : 'Activar'"
                      >
                        {{ alerta.activa ? '🔔' : '🔕' }}
                      </button>
                      <button
                        class="btn-icon eliminar"
                        (click)="eliminarAlerta(alerta.id)"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                }
              </div>
            }

            <button class="btn btn-outline" (click)="mostrarFormAlerta = !mostrarFormAlerta">
              {{ mostrarFormAlerta ? 'Cancelar' : 'Nueva alerta' }}
            </button>

            @if (mostrarFormAlerta) {
              <form class="nueva-alerta-form" (ngSubmit)="crearAlerta()">
                <div class="form-group">
                  <label>Categoria</label>
                  <select [(ngModel)]="nuevaAlerta.categoriaId" name="categoriaId">
                    <option value="">Cualquiera</option>
                    @for (cat of categorias(); track cat.id) {
                      <option [value]="cat.id">{{ cat.nombre }}</option>
                    }
                  </select>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Color</label>
                    <input
                      type="text"
                      [(ngModel)]="nuevaAlerta.color"
                      name="color"
                      placeholder="Ej: Negro, Azul..."
                    >
                  </div>
                  <div class="form-group">
                    <label>Zona</label>
                    <input
                      type="text"
                      [(ngModel)]="nuevaAlerta.zona"
                      name="zona"
                      placeholder="Ej: Centro, Alameda..."
                    >
                  </div>
                </div>

                <div class="form-group">
                  <label>Palabras clave</label>
                  <input
                    type="text"
                    [(ngModel)]="nuevaAlerta.palabrasClave"
                    name="palabrasClave"
                    placeholder="Ej: Samsung, cartera, llaves..."
                  >
                </div>

                <button type="submit" class="btn btn-primary" [disabled]="creandoAlerta()">
                  {{ creandoAlerta() ? 'Creando...' : 'Crear alerta' }}
                </button>
              </form>
            }
          }
        </div>

        <div class="perfil-card danger">
          <h2>Cerrar sesion</h2>
          <p>Cierra tu sesion en este dispositivo.</p>
          <button class="btn btn-danger" (click)="cerrarSesion()">
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .perfil-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .perfil-header {
      margin-bottom: 2rem;
    }

    h1 {
      margin: 0;
    }

    .perfil-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .perfil-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .perfil-card.danger {
      border-left: 4px solid #e53935;
    }

    h2 {
      margin: 0 0 1.5rem;
      font-size: 1.25rem;
    }

    .descripcion {
      color: #666;
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    input, select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    input:disabled {
      background: #f5f5f5;
      color: #999;
    }

    small {
      color: #999;
      font-size: 0.75rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-outline {
      background: white;
      border: 1px solid #667eea;
      color: #667eea;
    }

    .btn-danger {
      background: #e53935;
      color: white;
    }

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .success-message {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .loading {
      color: #666;
      text-align: center;
      padding: 2rem;
    }

    .no-alertas {
      color: #999;
      text-align: center;
      padding: 2rem;
      background: #f9f9f9;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .alertas-lista {
      margin-bottom: 1rem;
    }

    .alerta-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }

    .alerta-item.inactiva {
      opacity: 0.6;
    }

    .alerta-criterios {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .criterio {
      background: #e3f2fd;
      color: #1976d2;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .alerta-fecha {
      font-size: 0.75rem;
      color: #999;
    }

    .alerta-acciones {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .btn-icon:hover {
      opacity: 1;
    }

    .btn-icon.activa {
      opacity: 1;
    }

    .nueva-alerta-form {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #eee;
    }

    @media (max-width: 600px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  datosPersonales = {
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    dni: ''
  };

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  alertas = signal<Alerta[]>([]);
  categorias = signal<any[]>([]);

  guardandoDatos = signal(false);
  successDatos = signal('');
  errorDatos = signal('');

  guardandoPassword = signal(false);
  successPassword = signal('');
  errorPassword = signal('');

  loadingAlertas = signal(true);
  mostrarFormAlerta = false;
  creandoAlerta = signal(false);

  nuevaAlerta = {
    categoriaId: '',
    color: '',
    zona: '',
    palabrasClave: ''
  };

  ngOnInit() {
    this.cargarDatosUsuario();
    this.cargarAlertas();
    this.cargarCategorias();
  }

  private cargarDatosUsuario() {
    const user = this.authService.currentUser();
    if (user) {
      this.datosPersonales = {
        nombre: user.nombre || '',
        apellidos: user.apellidos || '',
        email: user.email || '',
        telefono: user.telefono || '',
        dni: user.dni || ''
      };
    }
  }

  private cargarAlertas() {
    this.loadingAlertas.set(true);
    this.api.get<Alerta[]>('/alertas').subscribe({
      next: (alertas) => {
        this.alertas.set(alertas);
        this.loadingAlertas.set(false);
      },
      error: () => {
        this.loadingAlertas.set(false);
      }
    });
  }

  private cargarCategorias() {
    this.api.get<any[]>('/categorias').subscribe({
      next: (categorias) => this.categorias.set(categorias)
    });
  }

  guardarDatos() {
    this.successDatos.set('');
    this.errorDatos.set('');
    this.guardandoDatos.set(true);

    this.api.put('/perfil', this.datosPersonales).subscribe({
      next: () => {
        this.guardandoDatos.set(false);
        this.successDatos.set('Datos actualizados correctamente');
        this.authService.refreshUser();
      },
      error: (err) => {
        this.guardandoDatos.set(false);
        this.errorDatos.set(err.message || 'Error al guardar los datos');
      }
    });
  }

  cambiarPassword() {
    this.successPassword.set('');
    this.errorPassword.set('');

    if (this.passwordData.newPassword.length < 8) {
      this.errorPassword.set('La nueva contrasena debe tener al menos 8 caracteres');
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.errorPassword.set('Las contrasenas no coinciden');
      return;
    }

    this.guardandoPassword.set(true);

    this.api.put('/perfil/password', {
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    }).subscribe({
      next: () => {
        this.guardandoPassword.set(false);
        this.successPassword.set('Contrasena cambiada correctamente');
        this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: (err) => {
        this.guardandoPassword.set(false);
        this.errorPassword.set(err.message || 'Error al cambiar la contrasena');
      }
    });
  }

  toggleAlerta(alerta: Alerta) {
    this.api.put(`/alertas/${alerta.id}`, { activa: !alerta.activa }).subscribe({
      next: () => {
        const alertas = this.alertas();
        const index = alertas.findIndex(a => a.id === alerta.id);
        if (index !== -1) {
          alertas[index].activa = !alertas[index].activa;
          this.alertas.set([...alertas]);
        }
      }
    });
  }

  eliminarAlerta(id: number) {
    if (!confirm('¿Seguro que quieres eliminar esta alerta?')) return;

    this.api.delete(`/alertas/${id}`).subscribe({
      next: () => {
        this.alertas.set(this.alertas().filter(a => a.id !== id));
      }
    });
  }

  crearAlerta() {
    const criterios: any = {};
    if (this.nuevaAlerta.categoriaId) criterios.categoriaId = +this.nuevaAlerta.categoriaId;
    if (this.nuevaAlerta.color) criterios.color = this.nuevaAlerta.color;
    if (this.nuevaAlerta.zona) criterios.zona = this.nuevaAlerta.zona;
    if (this.nuevaAlerta.palabrasClave) criterios.palabrasClave = this.nuevaAlerta.palabrasClave;

    if (Object.keys(criterios).length === 0) {
      alert('Debes definir al menos un criterio');
      return;
    }

    this.creandoAlerta.set(true);

    this.api.post<Alerta>('/alertas', { criterios }).subscribe({
      next: (alerta) => {
        this.creandoAlerta.set(false);
        this.alertas.set([alerta, ...this.alertas()]);
        this.mostrarFormAlerta = false;
        this.nuevaAlerta = { categoriaId: '', color: '', zona: '', palabrasClave: '' };
      },
      error: (err) => {
        this.creandoAlerta.set(false);
        alert(err.message || 'Error al crear la alerta');
      }
    });
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
