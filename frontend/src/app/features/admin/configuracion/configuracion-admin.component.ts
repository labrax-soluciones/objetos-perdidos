import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface Ayuntamiento {
  id: number;
  nombre: string;
  cif: string;
  direccion: string;
  telefono: string;
  email: string;
  configuracion: {
    colorPrimario?: string;
    colorSecundario?: string;
    logoUrl?: string;
    diasHastaSubasta?: number;
    emailNotificaciones?: string;
  };
}

@Component({
  selector: 'app-configuracion-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="configuracion-container">
      <div class="header">
        <h1>Configuracion</h1>
      </div>

      @if (loading()) {
        <div class="loading">Cargando configuracion...</div>
      } @else if (ayuntamiento()) {
        <div class="config-sections">
          <div class="config-card">
            <h2>Datos del ayuntamiento</h2>

            @if (successDatos()) {
              <div class="success-message">{{ successDatos() }}</div>
            }

            <form (ngSubmit)="guardarDatos()">
              <div class="form-group">
                <label>Nombre</label>
                <input type="text" [(ngModel)]="formDatos.nombre" name="nombre">
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>CIF</label>
                  <input type="text" [(ngModel)]="formDatos.cif" name="cif">
                </div>
                <div class="form-group">
                  <label>Telefono</label>
                  <input type="tel" [(ngModel)]="formDatos.telefono" name="telefono">
                </div>
              </div>

              <div class="form-group">
                <label>Direccion</label>
                <input type="text" [(ngModel)]="formDatos.direccion" name="direccion">
              </div>

              <div class="form-group">
                <label>Email de contacto</label>
                <input type="email" [(ngModel)]="formDatos.email" name="email">
              </div>

              <button type="submit" class="btn btn-primary" [disabled]="guardandoDatos()">
                {{ guardandoDatos() ? 'Guardando...' : 'Guardar cambios' }}
              </button>
            </form>
          </div>

          <div class="config-card">
            <h2>Personalizacion</h2>

            @if (successConfig()) {
              <div class="success-message">{{ successConfig() }}</div>
            }

            <form (ngSubmit)="guardarConfig()">
              <div class="form-row">
                <div class="form-group">
                  <label>Color primario</label>
                  <div class="color-input">
                    <input
                      type="color"
                      [(ngModel)]="formConfig.colorPrimario"
                      name="colorPrimario"
                    >
                    <input
                      type="text"
                      [(ngModel)]="formConfig.colorPrimario"
                      name="colorPrimarioText"
                      placeholder="#667eea"
                    >
                  </div>
                </div>
                <div class="form-group">
                  <label>Color secundario</label>
                  <div class="color-input">
                    <input
                      type="color"
                      [(ngModel)]="formConfig.colorSecundario"
                      name="colorSecundario"
                    >
                    <input
                      type="text"
                      [(ngModel)]="formConfig.colorSecundario"
                      name="colorSecundarioText"
                      placeholder="#764ba2"
                    >
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Logo (URL)</label>
                <input
                  type="url"
                  [(ngModel)]="formConfig.logoUrl"
                  name="logoUrl"
                  placeholder="https://..."
                >
                @if (formConfig.logoUrl) {
                  <div class="logo-preview">
                    <img [src]="formConfig.logoUrl" alt="Logo preview">
                  </div>
                }
              </div>

              <button type="submit" class="btn btn-primary" [disabled]="guardandoConfig()">
                {{ guardandoConfig() ? 'Guardando...' : 'Guardar personalizacion' }}
              </button>
            </form>
          </div>

          <div class="config-card">
            <h2>Configuracion del sistema</h2>

            @if (successSistema()) {
              <div class="success-message">{{ successSistema() }}</div>
            }

            <form (ngSubmit)="guardarSistema()">
              <div class="form-group">
                <label>Dias hasta subasta automatica</label>
                <input
                  type="number"
                  [(ngModel)]="formSistema.diasHastaSubasta"
                  name="diasHastaSubasta"
                  min="365"
                  step="1"
                >
                <small>Por ley, los objetos no reclamados pasan a subasta tras 2 anos (730 dias)</small>
              </div>

              <div class="form-group">
                <label>Email para notificaciones del sistema</label>
                <input
                  type="email"
                  [(ngModel)]="formSistema.emailNotificaciones"
                  name="emailNotificaciones"
                  placeholder="notificaciones@ayuntamiento.es"
                >
              </div>

              <button type="submit" class="btn btn-primary" [disabled]="guardandoSistema()">
                {{ guardandoSistema() ? 'Guardando...' : 'Guardar configuracion' }}
              </button>
            </form>
          </div>

          <div class="config-card">
            <h2>Categorias</h2>
            <p class="descripcion">Gestiona las categorias de objetos disponibles.</p>

            <div class="categorias-lista">
              @for (categoria of categorias(); track categoria.id) {
                <div class="categoria-item">
                  <span class="categoria-icono">{{ categoria.icono || '📦' }}</span>
                  <span class="categoria-nombre">{{ categoria.nombre }}</span>
                  <button class="btn-icon" (click)="editarCategoria(categoria)">✏️</button>
                  <button class="btn-icon" (click)="eliminarCategoria(categoria.id)">🗑️</button>
                </div>
              }
            </div>

            <button class="btn btn-outline" (click)="abrirModalCategoria()">
              + Nueva categoria
            </button>
          </div>
        </div>
      }

      @if (modalCategoria()) {
        <div class="modal-overlay" (click)="cerrarModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>{{ categoriaEditar ? 'Editar' : 'Nueva' }} categoria</h2>

            <div class="form-group">
              <label>Nombre *</label>
              <input type="text" [(ngModel)]="formCategoria.nombre">
            </div>

            <div class="form-group">
              <label>Icono (emoji)</label>
              <input type="text" [(ngModel)]="formCategoria.icono" placeholder="📱">
            </div>

            <div class="form-group">
              <label>Descripcion</label>
              <textarea [(ngModel)]="formCategoria.descripcion" rows="3"></textarea>
            </div>

            <div class="modal-acciones">
              <button class="btn btn-outline" (click)="cerrarModal()">Cancelar</button>
              <button class="btn btn-primary" (click)="guardarCategoria()" [disabled]="guardandoCategoria()">
                {{ guardandoCategoria() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .configuracion-container {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 2rem;
    }

    h1 { margin: 0; }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .config-sections {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .config-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .config-card h2 {
      margin: 0 0 1.5rem;
      font-size: 1.25rem;
    }

    .descripcion {
      color: #666;
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-group input, .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
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

    .color-input {
      display: flex;
      gap: 0.5rem;
    }

    .color-input input[type="color"] {
      width: 50px;
      height: 42px;
      padding: 0;
      border: none;
      cursor: pointer;
    }

    .color-input input[type="text"] {
      flex: 1;
    }

    .logo-preview {
      margin-top: 1rem;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 8px;
      text-align: center;
    }

    .logo-preview img {
      max-width: 200px;
      max-height: 100px;
    }

    .categorias-lista {
      margin-bottom: 1rem;
    }

    .categoria-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #f9f9f9;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }

    .categoria-icono {
      font-size: 1.5rem;
    }

    .categoria-nombre {
      flex: 1;
      font-weight: 500;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-primary { background: #667eea; color: white; }
    .btn-outline { background: white; border: 1px solid #667eea; color: #667eea; }

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      opacity: 0.6;
    }

    .btn-icon:hover { opacity: 1; }

    .success-message {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

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
      max-width: 500px;
      width: 90%;
    }

    .modal h2 { margin: 0 0 1.5rem; }

    .modal-acciones {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    @media (max-width: 600px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ConfiguracionAdminComponent implements OnInit {
  private api = inject(ApiService);

  ayuntamiento = signal<Ayuntamiento | null>(null);
  categorias = signal<any[]>([]);
  loading = signal(true);

  guardandoDatos = signal(false);
  guardandoConfig = signal(false);
  guardandoSistema = signal(false);
  guardandoCategoria = signal(false);

  successDatos = signal('');
  successConfig = signal('');
  successSistema = signal('');

  formDatos = {
    nombre: '',
    cif: '',
    telefono: '',
    direccion: '',
    email: ''
  };

  formConfig = {
    colorPrimario: '#667eea',
    colorSecundario: '#764ba2',
    logoUrl: ''
  };

  formSistema = {
    diasHastaSubasta: 730,
    emailNotificaciones: ''
  };

  modalCategoria = signal(false);
  categoriaEditar: any = null;
  formCategoria = {
    nombre: '',
    icono: '',
    descripcion: ''
  };

  ngOnInit() {
    this.cargarDatos();
  }

  private cargarDatos() {
    this.loading.set(true);
    this.api.get<Ayuntamiento>('/admin/configuracion').subscribe({
      next: (data) => {
        this.ayuntamiento.set(data);
        this.formDatos = {
          nombre: data.nombre,
          cif: data.cif,
          telefono: data.telefono,
          direccion: data.direccion,
          email: data.email
        };
        this.formConfig = {
          colorPrimario: data.configuracion?.colorPrimario || '#667eea',
          colorSecundario: data.configuracion?.colorSecundario || '#764ba2',
          logoUrl: data.configuracion?.logoUrl || ''
        };
        this.formSistema = {
          diasHastaSubasta: data.configuracion?.diasHastaSubasta || 730,
          emailNotificaciones: data.configuracion?.emailNotificaciones || ''
        };
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.api.get<any[]>('/categorias').subscribe({
      next: (data) => this.categorias.set(data)
    });
  }

  guardarDatos() {
    this.successDatos.set('');
    this.guardandoDatos.set(true);

    this.api.put('/admin/configuracion/datos', this.formDatos).subscribe({
      next: () => {
        this.guardandoDatos.set(false);
        this.successDatos.set('Datos guardados correctamente');
      },
      error: () => this.guardandoDatos.set(false)
    });
  }

  guardarConfig() {
    this.successConfig.set('');
    this.guardandoConfig.set(true);

    this.api.put('/admin/configuracion/personalizacion', this.formConfig).subscribe({
      next: () => {
        this.guardandoConfig.set(false);
        this.successConfig.set('Personalizacion guardada correctamente');
      },
      error: () => this.guardandoConfig.set(false)
    });
  }

  guardarSistema() {
    this.successSistema.set('');
    this.guardandoSistema.set(true);

    this.api.put('/admin/configuracion/sistema', this.formSistema).subscribe({
      next: () => {
        this.guardandoSistema.set(false);
        this.successSistema.set('Configuracion guardada correctamente');
      },
      error: () => this.guardandoSistema.set(false)
    });
  }

  abrirModalCategoria(categoria?: any) {
    this.categoriaEditar = categoria || null;
    this.formCategoria = categoria
      ? { nombre: categoria.nombre, icono: categoria.icono || '', descripcion: categoria.descripcion || '' }
      : { nombre: '', icono: '', descripcion: '' };
    this.modalCategoria.set(true);
  }

  editarCategoria(categoria: any) {
    this.abrirModalCategoria(categoria);
  }

  cerrarModal() {
    this.modalCategoria.set(false);
    this.categoriaEditar = null;
  }

  guardarCategoria() {
    if (!this.formCategoria.nombre) return;
    this.guardandoCategoria.set(true);

    const request = this.categoriaEditar
      ? this.api.put(`/admin/categorias/${this.categoriaEditar.id}`, this.formCategoria)
      : this.api.post('/admin/categorias', this.formCategoria);

    request.subscribe({
      next: () => {
        this.guardandoCategoria.set(false);
        this.cerrarModal();
        this.api.get<any[]>('/categorias').subscribe({
          next: (data) => this.categorias.set(data)
        });
      },
      error: () => this.guardandoCategoria.set(false)
    });
  }

  eliminarCategoria(id: number) {
    if (!confirm('¿Eliminar esta categoria?')) return;

    this.api.delete(`/admin/categorias/${id}`).subscribe({
      next: () => {
        this.categorias.set(this.categorias().filter(c => c.id !== id));
      }
    });
  }
}
