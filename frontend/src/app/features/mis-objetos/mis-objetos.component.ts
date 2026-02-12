import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface Objeto {
  id: number;
  codigoUnico: string;
  titulo: string;
  descripcion?: string;
  tipo: string;
  estado: string;
  categoria?: { id: number; nombre: string };
  fotoPrincipal?: { url: string; thumbnailUrl: string };
  fechaHallazgo?: string;
  direccionHallazgo?: string;
  createdAt: string;
}

interface Categoria {
  id: number;
  nombre: string;
  icono?: string;
}

@Component({
  selector: 'app-mis-objetos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto p-8">
      <div class="mb-8">
        <h1 class="m-0">Mi zona</h1>
      </div>

      <div class="flex mb-8 border-b-2 border-gray-200 overflow-x-auto">
        <button
          class="px-6 py-4 border-none bg-transparent cursor-pointer text-sm whitespace-nowrap -mb-0.5 border-b-2"
          [class]="tabActiva() === 'perdidos' ? 'text-primary border-primary' : 'text-gray-500 border-transparent'"
          (click)="cambiarTab('perdidos')"
        >
          Mis objetos perdidos
        </button>
        <button
          class="px-6 py-4 border-none bg-transparent cursor-pointer text-sm whitespace-nowrap -mb-0.5 border-b-2"
          [class]="tabActiva() === 'encontrados' ? 'text-primary border-primary' : 'text-gray-500 border-transparent'"
          (click)="cambiarTab('encontrados')"
        >
          Objetos que he encontrado
        </button>
        <button
          class="px-6 py-4 border-none bg-transparent cursor-pointer text-sm whitespace-nowrap -mb-0.5 border-b-2"
          [class]="tabActiva() === 'solicitudes' ? 'text-primary border-primary' : 'text-gray-500 border-transparent'"
          (click)="cambiarTab('solicitudes')"
        >
          Mis solicitudes
        </button>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-500">Cargando...</div>
      } @else {
        <!-- Tab Objetos Perdidos -->
        @if (tabActiva() === 'perdidos') {
          <div class="mb-8">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 class="m-0 text-xl">Objetos que he perdido</h2>
              <button class="px-6 py-3 border-none rounded-md font-medium cursor-pointer text-sm bg-primary text-white" (click)="mostrarFormulario('perdido')">
                + Reportar objeto perdido
              </button>
            </div>

            @if (mostrandoFormulario() === 'perdido') {
              <div class="bg-white p-8 rounded-xl shadow-lg mb-8">
                <h3 class="m-0 mb-4">Reportar objeto perdido</h3>
                <form (ngSubmit)="guardarObjeto('PERDIDO')">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="mb-4">
                      <label class="block mb-2 font-medium text-gray-800">Titulo *</label>
                      <input type="text" [(ngModel)]="formObjeto.titulo" name="titulo" required
                        placeholder="Ej: Cartera negra con documentos"
                        class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white">
                    </div>
                    <div class="mb-4">
                      <label class="block mb-2 font-medium text-gray-800">Categoria *</label>
                      <select [(ngModel)]="formObjeto.categoriaId" name="categoriaId" required
                        class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white">
                        <option value="">Selecciona categoria</option>
                        @for (cat of categorias(); track cat.id) {
                          <option [value]="cat.id">{{ cat.icono }} {{ cat.nombre }}</option>
                        }
                      </select>
                    </div>
                  </div>

                  <div class="mb-4">
                    <label class="block mb-2 font-medium text-gray-800">Descripcion *</label>
                    <textarea [(ngModel)]="formObjeto.descripcion" name="descripcion" rows="3" required
                      placeholder="Describe el objeto con el mayor detalle posible"
                      class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white"></textarea>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="mb-4">
                      <label class="block mb-2 font-medium text-gray-800">Fecha en que lo perdiste *</label>
                      <input type="date" [(ngModel)]="formObjeto.fechaHallazgo" name="fechaHallazgo" required
                        class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white">
                    </div>
                    <div class="mb-4">
                      <label class="block mb-2 font-medium text-gray-800">Hora aproximada</label>
                      <input type="time" [(ngModel)]="formObjeto.horaHallazgo" name="horaHallazgo"
                        class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white">
                    </div>
                  </div>

                  <div class="mb-4">
                    <label class="block mb-2 font-medium text-gray-800">Lugar donde crees que lo perdiste *</label>
                    <input type="text" [(ngModel)]="formObjeto.direccionHallazgo" name="direccionHallazgo" required
                      placeholder="Ej: Parque Central, cerca de la fuente"
                      class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white">
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="mb-4">
                      <label class="block mb-2 font-medium text-gray-800">Marca</label>
                      <input type="text" [(ngModel)]="formObjeto.marca" name="marca" placeholder="Ej: Samsung, Nike..."
                        class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white">
                    </div>
                    <div class="mb-4">
                      <label class="block mb-2 font-medium text-gray-800">Color</label>
                      <input type="text" [(ngModel)]="formObjeto.color" name="color" placeholder="Ej: Negro, Azul..."
                        class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white">
                    </div>
                  </div>

                  <div class="flex gap-4 justify-end mt-6 pt-6 border-t border-gray-200">
                    <button type="button" class="px-6 py-3 rounded-md font-medium cursor-pointer text-sm bg-white border border-primary text-primary" (click)="cancelarFormulario()">Cancelar</button>
                    <button type="submit" class="px-6 py-3 border-none rounded-md font-medium cursor-pointer text-sm bg-primary text-white disabled:opacity-60 disabled:cursor-not-allowed" [disabled]="guardando()">
                      {{ guardando() ? 'Guardando...' : 'Reportar perdido' }}
                    </button>
                  </div>
                </form>
              </div>
            }

            @if (objetosPerdidos().length === 0 && !mostrandoFormulario()) {
              <div class="text-center py-16 px-8 bg-gray-50 rounded-xl">
                <span class="text-5xl block mb-4">🔍</span>
                <p class="text-gray-500 mb-6">No has reportado ningun objeto perdido</p>
                <button class="px-6 py-3 rounded-md font-medium cursor-pointer text-sm bg-white border border-primary text-primary" (click)="mostrarFormulario('perdido')">
                  Reportar mi primer objeto
                </button>
              </div>
            } @else if (!mostrandoFormulario()) {
              <div class="flex flex-col gap-4">
                @for (objeto of objetosPerdidos(); track objeto.id) {
                  <div class="flex flex-col sm:flex-row gap-6 bg-white p-6 rounded-xl shadow-md">
                    <div class="w-full sm:w-[100px] h-[180px] sm:h-[100px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      @if (objeto.fotoPrincipal?.thumbnailUrl) {
                        <img [src]="objeto.fotoPrincipal?.thumbnailUrl" [alt]="objeto.titulo" class="w-full h-full object-cover">
                      } @else {
                        <div class="h-full flex items-center justify-center text-4xl">🔍</div>
                      }
                    </div>
                    <div class="flex-1">
                      <h3 class="m-0 mb-1 text-lg">{{ objeto.titulo }}</h3>
                      <p class="text-gray-500 m-0 mb-3 text-sm line-clamp-2">{{ objeto.descripcion }}</p>
                      <div class="flex flex-wrap gap-3 items-center text-sm">
                        <span class="bg-gray-200 px-2 py-0.5 rounded">{{ objeto.categoria?.nombre }}</span>
                        <span class="text-gray-400">Perdido: {{ objeto.fechaHallazgo | date:'dd/MM/yyyy' }}</span>
                        <span class="px-2 py-1 rounded text-xs font-medium"
                          [ngClass]="{
                            'bg-blue-100 text-blue-800': objeto.estado.toLowerCase() === 'registrado',
                            'bg-orange-100 text-orange-800': objeto.estado.toLowerCase() === 'en_almacen',
                            'bg-yellow-100 text-yellow-800': objeto.estado.toLowerCase() === 'reclamado',
                            'bg-green-100 text-green-800': objeto.estado.toLowerCase() === 'entregado'
                          }">
                          {{ getEstadoLabel(objeto.estado) }}
                        </span>
                      </div>
                      @if (objeto.direccionHallazgo) {
                        <p class="mt-2 mb-0 text-sm text-gray-500">📍 {{ objeto.direccionHallazgo }}</p>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Tab Objetos Encontrados -->
        @if (tabActiva() === 'encontrados') {
          <div class="mb-8">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 class="m-0 text-xl">Objetos que he encontrado</h2>
              <button class="px-6 py-3 border-none rounded-md font-medium cursor-pointer text-sm bg-primary text-white" (click)="mostrarFormulario('encontrado')">
                + Entregar objeto encontrado
              </button>
            </div>

            @if (mostrandoFormulario() === 'encontrado') {
              <div class="bg-white p-8 rounded-xl shadow-lg mb-8">
                <h3 class="m-0 mb-4">Entregar objeto encontrado</h3>
                <p class="bg-blue-100 text-blue-800 p-4 rounded-lg mb-6 text-sm">Al registrar el objeto, deberás entregarlo en las oficinas municipales para su custodia.</p>
                <form (ngSubmit)="guardarObjeto('ENCONTRADO')">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="mb-4">
                      <label class="block mb-2 font-medium text-gray-800">Titulo *</label>
                      <input type="text" [(ngModel)]="formObjeto.titulo" name="titulo" required
                        placeholder="Ej: Movil iPhone encontrado"
                        class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white">
                    </div>
                    <div class="mb-4">
                      <label class="block mb-2 font-medium text-gray-800">Categoria *</label>
                      <select [(ngModel)]="formObjeto.categoriaId" name="categoriaId" required
                        class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white">
                        <option value="">Selecciona categoria</option>
                        @for (cat of categorias(); track cat.id) {
                          <option [value]="cat.id">{{ cat.icono }} {{ cat.nombre }}</option>
                        }
                      </select>
                    </div>
                  </div>

                  <div class="mb-4">
                    <label class="block mb-2 font-medium text-gray-800">Descripcion *</label>
                    <textarea [(ngModel)]="formObjeto.descripcion" name="descripcion" rows="3" required
                      placeholder="Describe el objeto que has encontrado"
                      class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white"></textarea>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="mb-4">
                      <label class="block mb-2 font-medium text-gray-800">Fecha en que lo encontraste *</label>
                      <input type="date" [(ngModel)]="formObjeto.fechaHallazgo" name="fechaHallazgo" required
                        class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white">
                    </div>
                    <div class="mb-4">
                      <label class="block mb-2 font-medium text-gray-800">Hora aproximada</label>
                      <input type="time" [(ngModel)]="formObjeto.horaHallazgo" name="horaHallazgo"
                        class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white">
                    </div>
                  </div>

                  <div class="mb-4">
                    <label class="block mb-2 font-medium text-gray-800">Lugar donde lo encontraste *</label>
                    <input type="text" [(ngModel)]="formObjeto.direccionHallazgo" name="direccionHallazgo" required
                      placeholder="Ej: Parada de autobus linea 5"
                      class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white">
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="mb-4">
                      <label class="block mb-2 font-medium text-gray-800">Marca</label>
                      <input type="text" [(ngModel)]="formObjeto.marca" name="marca" placeholder="Ej: Samsung, Nike..."
                        class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white">
                    </div>
                    <div class="mb-4">
                      <label class="block mb-2 font-medium text-gray-800">Color</label>
                      <input type="text" [(ngModel)]="formObjeto.color" name="color" placeholder="Ej: Negro, Azul..."
                        class="w-full py-3 px-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white">
                    </div>
                  </div>

                  <div class="flex gap-4 justify-end mt-6 pt-6 border-t border-gray-200">
                    <button type="button" class="px-6 py-3 rounded-md font-medium cursor-pointer text-sm bg-white border border-primary text-primary" (click)="cancelarFormulario()">Cancelar</button>
                    <button type="submit" class="px-6 py-3 border-none rounded-md font-medium cursor-pointer text-sm bg-success text-white disabled:opacity-60 disabled:cursor-not-allowed" [disabled]="guardando()">
                      {{ guardando() ? 'Guardando...' : 'Registrar y entregar' }}
                    </button>
                  </div>
                </form>
              </div>
            }

            @if (objetosEncontrados().length === 0 && !mostrandoFormulario()) {
              <div class="text-center py-16 px-8 bg-gray-50 rounded-xl">
                <span class="text-5xl block mb-4">📦</span>
                <p class="text-gray-500 mb-6">No has entregado ningun objeto encontrado</p>
                <button class="px-6 py-3 rounded-md font-medium cursor-pointer text-sm bg-white border border-primary text-primary" (click)="mostrarFormulario('encontrado')">
                  Entregar un objeto
                </button>
              </div>
            } @else if (!mostrandoFormulario()) {
              <div class="flex flex-col gap-4">
                @for (objeto of objetosEncontrados(); track objeto.id) {
                  <div class="flex flex-col sm:flex-row gap-6 bg-white p-6 rounded-xl shadow-md">
                    <div class="w-full sm:w-[100px] h-[180px] sm:h-[100px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      @if (objeto.fotoPrincipal?.thumbnailUrl) {
                        <img [src]="objeto.fotoPrincipal?.thumbnailUrl" [alt]="objeto.titulo" class="w-full h-full object-cover">
                      } @else {
                        <div class="h-full flex items-center justify-center text-4xl">📦</div>
                      }
                    </div>
                    <div class="flex-1">
                      <h3 class="m-0 mb-1 text-lg">{{ objeto.titulo }}</h3>
                      <p class="font-mono text-xs text-gray-400 m-0 mb-2">{{ objeto.codigoUnico }}</p>
                      <p class="text-gray-500 m-0 mb-3 text-sm line-clamp-2">{{ objeto.descripcion }}</p>
                      <div class="flex flex-wrap gap-3 items-center text-sm">
                        <span class="bg-gray-200 px-2 py-0.5 rounded">{{ objeto.categoria?.nombre }}</span>
                        <span class="text-gray-400">Encontrado: {{ objeto.fechaHallazgo | date:'dd/MM/yyyy' }}</span>
                        <span class="px-2 py-1 rounded text-xs font-medium"
                          [ngClass]="{
                            'bg-blue-100 text-blue-800': objeto.estado.toLowerCase() === 'registrado',
                            'bg-orange-100 text-orange-800': objeto.estado.toLowerCase() === 'en_almacen',
                            'bg-yellow-100 text-yellow-800': objeto.estado.toLowerCase() === 'reclamado',
                            'bg-green-100 text-green-800': objeto.estado.toLowerCase() === 'entregado'
                          }">
                          {{ getEstadoLabel(objeto.estado) }}
                        </span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Tab Solicitudes -->
        @if (tabActiva() === 'solicitudes') {
          <div class="mb-8">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 class="m-0 text-xl">Mis solicitudes de recuperacion</h2>
            </div>

            @if (solicitudes().length === 0) {
              <div class="text-center py-16 px-8 bg-gray-50 rounded-xl">
                <span class="text-5xl block mb-4">📋</span>
                <p class="text-gray-500 mb-6">No tienes solicitudes de recuperacion</p>
                <a routerLink="/galeria" class="inline-block px-6 py-3 rounded-md font-medium text-sm bg-white border border-primary text-primary no-underline">
                  Buscar en la galeria
                </a>
              </div>
            } @else {
              <div class="flex flex-col gap-4">
                @for (solicitud of solicitudes(); track solicitud.id) {
                  <div class="flex flex-col sm:flex-row gap-6 bg-white p-6 rounded-xl shadow-md items-start sm:items-center">
                    <div>
                      @if (solicitud.objeto) {
                        <div class="flex gap-4 items-center">
                          @if (solicitud.objeto.fotoPrincipal?.thumbnailUrl) {
                            <img [src]="solicitud.objeto.fotoPrincipal.thumbnailUrl" [alt]="solicitud.objeto.titulo" class="w-[60px] h-[60px] rounded-md object-cover">
                          } @else {
                            <div class="w-[60px] h-[60px] rounded-md bg-gray-100 flex items-center justify-center text-2xl">📦</div>
                          }
                          <div>
                            <h4 class="m-0 mb-1">{{ solicitud.objeto.titulo }}</h4>
                            <span class="font-mono text-xs text-gray-400">{{ solicitud.objeto.codigoUnico }}</span>
                          </div>
                        </div>
                      }
                    </div>
                    <div class="flex-1 flex flex-wrap gap-4 items-center">
                      <span class="px-3 py-1.5 rounded-md text-sm font-medium"
                        [ngClass]="{
                          'bg-orange-100 text-orange-800': solicitud.estado.toLowerCase() === 'pendiente',
                          'bg-blue-100 text-blue-800': solicitud.estado.toLowerCase() === 'validando',
                          'bg-green-100 text-green-800': solicitud.estado.toLowerCase() === 'aprobada' || solicitud.estado.toLowerCase() === 'entregada',
                          'bg-red-100 text-red-800': solicitud.estado.toLowerCase() === 'rechazada'
                        }">
                        {{ getSolicitudEstadoLabel(solicitud.estado) }}
                      </span>
                      <span class="text-gray-400 text-sm">Solicitado: {{ solicitud.createdAt | date:'dd/MM/yyyy' }}</span>
                      @if (solicitud.fechaCita) {
                        <span class="text-primary font-medium text-sm">📅 Cita: {{ solicitud.fechaCita | date:'dd/MM/yyyy HH:mm' }}</span>
                      }
                      @if (solicitud.motivoRechazo) {
                        <p class="w-full m-0 text-red-700 text-sm">❌ {{ solicitud.motivoRechazo }}</p>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: []
})
export class MisObjetosComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  tabActiva = signal<'perdidos' | 'encontrados' | 'solicitudes'>('perdidos');
  objetosPerdidos = signal<Objeto[]>([]);
  objetosEncontrados = signal<Objeto[]>([]);
  solicitudes = signal<any[]>([]);
  categorias = signal<Categoria[]>([]);
  loading = signal(true);
  guardando = signal(false);

  mostrandoFormulario = signal<'perdido' | 'encontrado' | null>(null);

  formObjeto = {
    titulo: '',
    descripcion: '',
    categoriaId: '',
    fechaHallazgo: '',
    horaHallazgo: '',
    direccionHallazgo: '',
    marca: '',
    color: ''
  };

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/mis-objetos' }
      });
      return;
    }

    this.loadCategorias();
    this.loadData();

    // Check query params for action
    const accion = this.route.snapshot.queryParams['accion'];
    if (accion === 'perdido') {
      this.tabActiva.set('perdidos');
      this.mostrarFormulario('perdido');
    } else if (accion === 'encontrado') {
      this.tabActiva.set('encontrados');
      this.mostrarFormulario('encontrado');
    }

    // Set default date to today
    this.formObjeto.fechaHallazgo = new Date().toISOString().split('T')[0];
  }

  private loadCategorias() {
    this.api.get<any>('/categorias').subscribe({
      next: (response) => this.categorias.set(response.data || response)
    });
  }

  private loadData() {
    this.loading.set(true);
    this.api.get<any>('/mis-objetos').subscribe({
      next: (data) => {
        this.objetosPerdidos.set(data.perdidos || []);
        this.objetosEncontrados.set(data.encontrados || []);
        this.solicitudes.set(data.solicitudes || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  cambiarTab(tab: 'perdidos' | 'encontrados' | 'solicitudes') {
    this.tabActiva.set(tab);
    this.cancelarFormulario();
  }

  mostrarFormulario(tipo: 'perdido' | 'encontrado') {
    this.mostrandoFormulario.set(tipo);
    this.resetForm();
  }

  cancelarFormulario() {
    this.mostrandoFormulario.set(null);
    this.resetForm();
  }

  private resetForm() {
    this.formObjeto = {
      titulo: '',
      descripcion: '',
      categoriaId: '',
      fechaHallazgo: new Date().toISOString().split('T')[0],
      horaHallazgo: '',
      direccionHallazgo: '',
      marca: '',
      color: ''
    };
  }

  guardarObjeto(tipo: 'PERDIDO' | 'ENCONTRADO') {
    if (!this.formObjeto.titulo || !this.formObjeto.categoriaId ||
        !this.formObjeto.descripcion || !this.formObjeto.fechaHallazgo ||
        !this.formObjeto.direccionHallazgo) {
      alert('Por favor, completa todos los campos obligatorios');
      return;
    }

    this.guardando.set(true);

    const data = {
      ...this.formObjeto,
      tipo
    };

    this.api.post('/objetos/reportar', data).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cancelarFormulario();
        this.loadData();
        alert(tipo === 'PERDIDO'
          ? 'Objeto perdido registrado. Te avisaremos si aparece.'
          : 'Gracias por entregar el objeto. Acude a las oficinas municipales para completar la entrega.');
      },
      error: (err) => {
        this.guardando.set(false);
        alert(err.error?.message || 'Error al guardar');
      }
    });
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
      'VALIDANDO': 'En validacion',
      'APROBADA': 'Aprobada',
      'RECHAZADA': 'Rechazada',
      'ENTREGADA': 'Entregada'
    };
    return labels[estado] || estado;
  }
}
