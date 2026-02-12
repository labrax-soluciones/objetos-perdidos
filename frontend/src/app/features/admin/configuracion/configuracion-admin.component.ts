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
    <div class="p-8 max-w-4xl mx-auto">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-800 m-0">Configuracion</h1>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-500">Cargando configuracion...</div>
      } @else if (ayuntamiento()) {
        <div class="flex flex-col gap-6">
          <!-- Datos del ayuntamiento -->
          <div class="bg-white p-8 rounded-xl shadow-md">
            <h2 class="m-0 mb-6 text-xl font-semibold text-gray-800">Datos del ayuntamiento</h2>

            @if (successDatos()) {
              <div class="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4">{{ successDatos() }}</div>
            }

            <form (ngSubmit)="guardarDatos()">
              <div class="mb-4">
                <label class="block mb-2 font-medium text-gray-700">Nombre</label>
                <input type="text" [(ngModel)]="formDatos.nombre" name="nombre"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="mb-4">
                  <label class="block mb-2 font-medium text-gray-700">CIF</label>
                  <input type="text" [(ngModel)]="formDatos.cif" name="cif"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
                </div>
                <div class="mb-4">
                  <label class="block mb-2 font-medium text-gray-700">Telefono</label>
                  <input type="tel" [(ngModel)]="formDatos.telefono" name="telefono"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
                </div>
              </div>

              <div class="mb-4">
                <label class="block mb-2 font-medium text-gray-700">Direccion</label>
                <input type="text" [(ngModel)]="formDatos.direccion" name="direccion"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
              </div>

              <div class="mb-4">
                <label class="block mb-2 font-medium text-gray-700">Email de contacto</label>
                <input type="email" [(ngModel)]="formDatos.email" name="email"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
              </div>

              <button type="submit"
                class="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                [disabled]="guardandoDatos()">
                {{ guardandoDatos() ? 'Guardando...' : 'Guardar cambios' }}
              </button>
            </form>
          </div>

          <!-- Personalizacion -->
          <div class="bg-white p-8 rounded-xl shadow-md">
            <h2 class="m-0 mb-6 text-xl font-semibold text-gray-800">Personalizacion</h2>

            @if (successConfig()) {
              <div class="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4">{{ successConfig() }}</div>
            }

            <form (ngSubmit)="guardarConfig()">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="mb-4">
                  <label class="block mb-2 font-medium text-gray-700">Color primario</label>
                  <div class="flex gap-2">
                    <input
                      type="color"
                      [(ngModel)]="formConfig.colorPrimario"
                      name="colorPrimario"
                      class="w-12 h-11 p-0 border-none cursor-pointer rounded"
                    >
                    <input
                      type="text"
                      [(ngModel)]="formConfig.colorPrimario"
                      name="colorPrimarioText"
                      placeholder="#667eea"
                      class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    >
                  </div>
                </div>
                <div class="mb-4">
                  <label class="block mb-2 font-medium text-gray-700">Color secundario</label>
                  <div class="flex gap-2">
                    <input
                      type="color"
                      [(ngModel)]="formConfig.colorSecundario"
                      name="colorSecundario"
                      class="w-12 h-11 p-0 border-none cursor-pointer rounded"
                    >
                    <input
                      type="text"
                      [(ngModel)]="formConfig.colorSecundario"
                      name="colorSecundarioText"
                      placeholder="#764ba2"
                      class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    >
                  </div>
                </div>
              </div>

              <div class="mb-4">
                <label class="block mb-2 font-medium text-gray-700">Logo (URL)</label>
                <input
                  type="url"
                  [(ngModel)]="formConfig.logoUrl"
                  name="logoUrl"
                  placeholder="https://..."
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                >
                @if (formConfig.logoUrl) {
                  <div class="mt-4 p-4 bg-gray-50 rounded-lg text-center">
                    <img [src]="formConfig.logoUrl" alt="Logo preview" class="max-w-48 max-h-24 inline-block">
                  </div>
                }
              </div>

              <button type="submit"
                class="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                [disabled]="guardandoConfig()">
                {{ guardandoConfig() ? 'Guardando...' : 'Guardar personalizacion' }}
              </button>
            </form>
          </div>

          <!-- Configuracion del sistema -->
          <div class="bg-white p-8 rounded-xl shadow-md">
            <h2 class="m-0 mb-6 text-xl font-semibold text-gray-800">Configuracion del sistema</h2>

            @if (successSistema()) {
              <div class="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4">{{ successSistema() }}</div>
            }

            <form (ngSubmit)="guardarSistema()">
              <div class="mb-4">
                <label class="block mb-2 font-medium text-gray-700">Dias hasta subasta automatica</label>
                <input
                  type="number"
                  [(ngModel)]="formSistema.diasHastaSubasta"
                  name="diasHastaSubasta"
                  min="365"
                  step="1"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                >
                <small class="block mt-1 text-gray-400 text-xs">Por ley, los objetos no reclamados pasan a subasta tras 2 anos (730 dias)</small>
              </div>

              <div class="mb-4">
                <label class="block mb-2 font-medium text-gray-700">Email para notificaciones del sistema</label>
                <input
                  type="email"
                  [(ngModel)]="formSistema.emailNotificaciones"
                  name="emailNotificaciones"
                  placeholder="notificaciones@ayuntamiento.es"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                >
              </div>

              <button type="submit"
                class="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                [disabled]="guardandoSistema()">
                {{ guardandoSistema() ? 'Guardando...' : 'Guardar configuracion' }}
              </button>
            </form>
          </div>

          <!-- Categorias -->
          <div class="bg-white p-8 rounded-xl shadow-md">
            <h2 class="m-0 mb-4 text-xl font-semibold text-gray-800">Categorias</h2>
            <p class="text-gray-500 mb-4">Gestiona las categorias de objetos disponibles.</p>

            <div class="mb-4">
              @for (categoria of categorias(); track categoria.id) {
                <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg mb-2">
                  <span class="text-2xl">{{ categoria.icono || '📦' }}</span>
                  <span class="flex-1 font-medium text-gray-800">{{ categoria.nombre }}</span>
                  <button class="bg-transparent border-none cursor-pointer text-base opacity-60 hover:opacity-100 transition-opacity" (click)="editarCategoria(categoria)">✏️</button>
                  <button class="bg-transparent border-none cursor-pointer text-base opacity-60 hover:opacity-100 transition-opacity" (click)="eliminarCategoria(categoria.id)">🗑️</button>
                </div>
              }
            </div>

            <button class="px-6 py-3 bg-white border border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-white transition-colors" (click)="abrirModalCategoria()">
              + Nueva categoria
            </button>
          </div>
        </div>
      }

      <!-- Modal Categoria -->
      @if (modalCategoria()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="cerrarModal()">
          <div class="bg-white p-8 rounded-xl max-w-lg w-11/12" (click)="$event.stopPropagation()">
            <h2 class="m-0 mb-6 text-xl font-semibold text-gray-800">{{ categoriaEditar ? 'Editar' : 'Nueva' }} categoria</h2>

            <div class="mb-4">
              <label class="block mb-2 font-medium text-gray-700">Nombre *</label>
              <input type="text" [(ngModel)]="formCategoria.nombre"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
            </div>

            <div class="mb-4">
              <label class="block mb-2 font-medium text-gray-700">Icono (emoji)</label>
              <input type="text" [(ngModel)]="formCategoria.icono" placeholder="📱"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
            </div>

            <div class="mb-4">
              <label class="block mb-2 font-medium text-gray-700">Descripcion</label>
              <textarea [(ngModel)]="formCategoria.descripcion" rows="3"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary resize-none"></textarea>
            </div>

            <div class="flex gap-4 justify-end mt-6">
              <button class="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors" (click)="cerrarModal()">Cancelar</button>
              <button class="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed" (click)="guardarCategoria()" [disabled]="guardandoCategoria()">
                {{ guardandoCategoria() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
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
