import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';

interface Categoria {
  id: number;
  nombre: string;
}

interface Almacen {
  id: number;
  nombre: string;
  ubicaciones: Ubicacion[];
}

interface Ubicacion {
  id: number;
  codigo: string;
}

@Component({
  selector: 'app-objeto-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    FileUploadModule,
    ToastModule,
    ConfirmDialogModule,
    DividerModule,
    CardModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="max-w-4xl mx-auto p-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="m-0 text-2xl font-bold text-gray-800">{{ isEdit() ? 'Editar objeto' : 'Registrar objeto' }}</h1>
        <a routerLink="/admin/objetos" class="text-gray-500 no-underline hover:text-gray-700 flex items-center gap-2">
          <i class="pi pi-arrow-left"></i> Volver
        </a>
      </div>

      @if (loadingData()) {
        <div class="text-center py-12 text-gray-500">
          <i class="pi pi-spin pi-spinner text-4xl mb-4 block"></i>
          <p>Cargando...</p>
        </div>
      } @else {
        <form (ngSubmit)="guardar()" class="bg-white rounded-xl shadow-md">
          <!-- Informacion basica -->
          <div class="p-8 border-b border-gray-200">
            <h2 class="m-0 mb-6 text-lg text-gray-800 flex items-center gap-2">
              <i class="pi pi-info-circle text-primary"></i>
              Informacion basica
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-2">
                <label for="tipo" class="font-medium text-sm">Tipo *</label>
                <p-select
                  id="tipo"
                  [(ngModel)]="formData.tipo"
                  name="tipo"
                  [options]="tiposOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Selecciona tipo"
                  styleClass="w-full"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label for="categoria" class="font-medium text-sm">Categoria *</label>
                <p-select
                  id="categoria"
                  [(ngModel)]="formData.categoriaId"
                  name="categoriaId"
                  [options]="categoriasOptions()"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Selecciona categoria"
                  [filter]="true"
                  filterPlaceholder="Buscar..."
                  styleClass="w-full"
                />
              </div>
            </div>

            <div class="flex flex-col gap-2 mt-6">
              <label for="titulo" class="font-medium text-sm">Titulo *</label>
              <input
                pInputText
                id="titulo"
                [(ngModel)]="formData.titulo"
                name="titulo"
                placeholder="Descripcion breve del objeto"
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-2 mt-6">
              <label for="descripcion" class="font-medium text-sm">Descripcion</label>
              <textarea
                pTextarea
                id="descripcion"
                [(ngModel)]="formData.descripcion"
                name="descripcion"
                rows="4"
                placeholder="Descripcion detallada del objeto"
                class="w-full"
                [autoResize]="true"
              ></textarea>
            </div>
          </div>

          <!-- Caracteristicas -->
          <div class="p-8 border-b border-gray-200">
            <h2 class="m-0 mb-6 text-lg text-gray-800 flex items-center gap-2">
              <i class="pi pi-tag text-primary"></i>
              Caracteristicas
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-2">
                <label for="marca" class="font-medium text-sm">Marca</label>
                <input
                  pInputText
                  id="marca"
                  [(ngModel)]="formData.marca"
                  name="marca"
                  placeholder="Ej: Samsung, Nike..."
                  class="w-full"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label for="modelo" class="font-medium text-sm">Modelo</label>
                <input
                  pInputText
                  id="modelo"
                  [(ngModel)]="formData.modelo"
                  name="modelo"
                  placeholder="Ej: Galaxy S21..."
                  class="w-full"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div class="flex flex-col gap-2">
                <label for="color" class="font-medium text-sm">Color</label>
                <input
                  pInputText
                  id="color"
                  [(ngModel)]="formData.color"
                  name="color"
                  placeholder="Ej: Negro, Azul..."
                  class="w-full"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label for="numeroSerie" class="font-medium text-sm">Numero de serie</label>
                <input
                  pInputText
                  id="numeroSerie"
                  [(ngModel)]="formData.numeroSerie"
                  name="numeroSerie"
                  class="w-full"
                />
              </div>
            </div>

            <div class="flex flex-col gap-2 mt-6">
              <label for="valorEstimado" class="font-medium text-sm">Valor estimado</label>
              <p-inputNumber
                id="valorEstimado"
                [(ngModel)]="formData.valorEstimado"
                name="valorEstimado"
                mode="currency"
                currency="EUR"
                locale="es-ES"
                [minFractionDigits]="2"
                placeholder="0,00"
                styleClass="w-full"
              />
            </div>
          </div>

          <!-- Hallazgo -->
          <div class="p-8 border-b border-gray-200">
            <h2 class="m-0 mb-6 text-lg text-gray-800 flex items-center gap-2">
              <i class="pi pi-map-marker text-primary"></i>
              Hallazgo
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-2">
                <label for="fechaHallazgo" class="font-medium text-sm">Fecha de hallazgo *</label>
                <p-datepicker
                  id="fechaHallazgo"
                  [(ngModel)]="fechaHallazgoDate"
                  name="fechaHallazgo"
                  dateFormat="dd/mm/yy"
                  [showIcon]="true"
                  [showButtonBar]="true"
                  styleClass="w-full"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label for="horaHallazgo" class="font-medium text-sm">Hora</label>
                <p-datepicker
                  id="horaHallazgo"
                  [(ngModel)]="horaHallazgoDate"
                  name="horaHallazgo"
                  [timeOnly]="true"
                  [showIcon]="true"
                  styleClass="w-full"
                />
              </div>
            </div>

            <div class="flex flex-col gap-2 mt-6">
              <label for="direccionHallazgo" class="font-medium text-sm">Direccion / Lugar de hallazgo *</label>
              <input
                pInputText
                id="direccionHallazgo"
                [(ngModel)]="formData.direccionHallazgo"
                name="direccionHallazgo"
                placeholder="Calle, zona o punto de referencia"
                class="w-full"
              />
            </div>
          </div>

          <!-- Datos del hallador -->
          <div class="p-8 border-b border-gray-200">
            <h2 class="m-0 mb-6 text-lg text-gray-800 flex items-center gap-2">
              <i class="pi pi-user text-primary"></i>
              Datos del hallador
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-2">
                <label for="halladorNombre" class="font-medium text-sm">Nombre completo *</label>
                <input
                  pInputText
                  id="halladorNombre"
                  [(ngModel)]="formData.halladorNombre"
                  name="halladorNombre"
                  placeholder="Nombre y apellidos"
                  class="w-full"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label for="halladorTelefono" class="font-medium text-sm">Telefono *</label>
                <input
                  pInputText
                  id="halladorTelefono"
                  [(ngModel)]="formData.halladorTelefono"
                  name="halladorTelefono"
                  placeholder="Telefono de contacto"
                  class="w-full"
                />
              </div>
            </div>

            <div class="flex flex-col gap-2 mt-6">
              <label for="halladorDni" class="font-medium text-sm">DNI / NIE</label>
              <input
                pInputText
                id="halladorDni"
                [(ngModel)]="formData.halladorDni"
                name="halladorDni"
                placeholder="Documento de identidad (opcional)"
                class="w-full md:w-1/2"
              />
            </div>

            <div class="flex flex-col gap-2 mt-6">
              <label for="halladorObservaciones" class="font-medium text-sm">Observaciones</label>
              <textarea
                pTextarea
                id="halladorObservaciones"
                [(ngModel)]="formData.halladorObservaciones"
                name="halladorObservaciones"
                rows="3"
                placeholder="Circunstancias del hallazgo, estado del objeto, etc."
                class="w-full"
                [autoResize]="true"
              ></textarea>
            </div>
          </div>

          <!-- Ubicacion en almacen -->
          <div class="p-8 border-b border-gray-200">
            <h2 class="m-0 mb-6 text-lg text-gray-800 flex items-center gap-2">
              <i class="pi pi-box text-primary"></i>
              Ubicacion en almacen
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-2">
                <label for="almacen" class="font-medium text-sm">Almacen *</label>
                <p-select
                  id="almacen"
                  [(ngModel)]="selectedAlmacenId"
                  name="almacenId"
                  [options]="almacenesOptions()"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Selecciona almacen"
                  (onChange)="onAlmacenChange()"
                  styleClass="w-full"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label for="ubicacion" class="font-medium text-sm">Ubicacion *</label>
                <p-select
                  id="ubicacion"
                  [(ngModel)]="formData.ubicacionAlmacenId"
                  name="ubicacionAlmacenId"
                  [options]="ubicacionesOptions()"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Selecciona ubicacion"
                  [disabled]="!selectedAlmacenId"
                  styleClass="w-full"
                />
              </div>
            </div>

            <div class="flex flex-col gap-2 mt-6">
              <label for="estado" class="font-medium text-sm">Estado</label>
              <p-select
                id="estado"
                [(ngModel)]="formData.estado"
                name="estado"
                [options]="estadosOptions"
                optionLabel="label"
                optionValue="value"
                styleClass="w-full md:w-1/2"
              />
            </div>
          </div>

          <!-- Fotos -->
          <div class="p-8 border-b border-gray-200">
            <h2 class="m-0 mb-6 text-lg text-gray-800 flex items-center gap-2">
              <i class="pi pi-images text-primary"></i>
              Fotos
            </h2>

            @if (fotosExistentes().length > 0) {
              <div class="flex flex-wrap gap-4 mb-6">
                @for (foto of fotosExistentes(); track foto.id) {
                  <div class="relative group">
                    <img [src]="foto.thumbnailUrl || foto.url" alt="Foto" class="w-24 h-24 object-cover rounded-lg shadow-sm">
                    <button
                      type="button"
                      class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      (click)="confirmarEliminarFoto(foto.id)"
                    >
                      <span class="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs">
                        <i class="pi pi-times"></i>
                      </span>
                    </button>
                  </div>
                }
              </div>
            }

            <p-fileUpload
              mode="basic"
              name="fotos"
              accept="image/*"
              [multiple]="true"
              [maxFileSize]="5000000"
              chooseLabel="Seleccionar fotos"
              chooseIcon="pi pi-camera"
              (onSelect)="onFilesSelectedPrime($event)"
              [auto]="false"
              styleClass="w-full"
            />

            @if (nuevasFotos.length > 0) {
              <div class="mt-4">
                <p class="text-sm text-gray-500 mb-2">Fotos a subir ({{ nuevasFotos.length }}):</p>
                @for (file of nuevasFotos; track file.name; let i = $index) {
                  <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2">
                    <div class="flex items-center gap-2">
                      <i class="pi pi-image text-gray-400"></i>
                      <span class="text-sm">{{ file.name }}</span>
                      <span class="text-xs text-gray-400">({{ (file.size / 1024).toFixed(0) }} KB)</span>
                    </div>
                    <p-button
                      icon="pi pi-times"
                      [rounded]="true"
                      [text]="true"
                      severity="danger"
                      (onClick)="removerFoto(i)"
                    />
                  </div>
                }
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="flex justify-end gap-4 px-8 py-6 bg-gray-50 rounded-b-xl">
            <a routerLink="/admin/objetos">
              <p-button
                label="Cancelar"
                severity="secondary"
                [outlined]="true"
              />
            </a>
            <p-button
              [label]="saving() ? 'Guardando...' : (isEdit() ? 'Guardar cambios' : 'Registrar objeto')"
              icon="pi pi-check"
              [loading]="saving()"
              (onClick)="guardar()"
            />
          </div>
        </form>
      }
    </div>
  `,
  styles: []
})
export class ObjetoFormComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  isEdit = signal(false);
  loadingData = signal(true);
  saving = signal(false);

  categorias = signal<Categoria[]>([]);
  almacenes = signal<Almacen[]>([]);
  ubicacionesFiltradas = signal<Ubicacion[]>([]);
  fotosExistentes = signal<any[]>([]);

  selectedAlmacenId: string | null = null;
  nuevasFotos: File[] = [];

  // Date objects for p-datepicker
  fechaHallazgoDate: Date | null = null;
  horaHallazgoDate: Date | null = null;

  formData = {
    tipo: 'ENCONTRADO',
    categoriaId: null as string | null,
    titulo: '',
    descripcion: '',
    marca: '',
    modelo: '',
    color: '',
    numeroSerie: '',
    valorEstimado: null as number | null,
    fechaHallazgo: '',
    horaHallazgo: '',
    direccionHallazgo: '',
    halladorNombre: '',
    halladorTelefono: '',
    halladorDni: '',
    halladorObservaciones: '',
    ubicacionAlmacenId: null as string | null,
    estado: 'REGISTRADO'
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
    { label: 'En subasta', value: 'SUBASTA' },
    { label: 'Donado', value: 'DONADO' },
    { label: 'Reciclado', value: 'RECICLADO' },
    { label: 'Destruido', value: 'DESTRUIDO' }
  ];

  categoriasOptions = signal<{label: string, value: string}[]>([]);
  almacenesOptions = signal<{label: string, value: string}[]>([]);
  ubicacionesOptions = signal<{label: string, value: string}[]>([]);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit.set(true);
      this.loadObjeto(+id);
    }
    this.loadCategorias();
    this.loadAlmacenes();

    if (!id) {
      this.loadingData.set(false);
      this.fechaHallazgoDate = new Date();
    }
  }

  private loadObjeto(id: number) {
    this.api.get<any>(`/admin/objetos/${id}`).subscribe({
      next: (objeto) => {
        this.formData = {
          tipo: objeto.tipo,
          categoriaId: objeto.categoria?.id?.toString() || null,
          titulo: objeto.titulo,
          descripcion: objeto.descripcion || '',
          marca: objeto.marca || '',
          modelo: objeto.modelo || '',
          color: objeto.color || '',
          numeroSerie: objeto.numeroSerie || '',
          valorEstimado: objeto.valorEstimado,
          fechaHallazgo: objeto.fechaHallazgo?.split('T')[0] || '',
          horaHallazgo: objeto.horaHallazgo || '',
          direccionHallazgo: objeto.direccionHallazgo || '',
          halladorNombre: objeto.halladorNombre || '',
          halladorTelefono: objeto.halladorTelefono || '',
          halladorDni: objeto.halladorDni || '',
          halladorObservaciones: objeto.halladorObservaciones || '',
          ubicacionAlmacenId: objeto.ubicacionAlmacen?.id?.toString() || null,
          estado: objeto.estado
        };

        // Set date objects
        if (objeto.fechaHallazgo) {
          this.fechaHallazgoDate = new Date(objeto.fechaHallazgo);
        }
        if (objeto.horaHallazgo) {
          const [hours, minutes] = objeto.horaHallazgo.split(':');
          this.horaHallazgoDate = new Date();
          this.horaHallazgoDate.setHours(+hours, +minutes);
        }

        if (objeto.ubicacionAlmacen?.almacen) {
          this.selectedAlmacenId = objeto.ubicacionAlmacen.almacen.id.toString();
          this.onAlmacenChange();
        }
        this.fotosExistentes.set(objeto.fotos || []);
        this.loadingData.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Error al cargar el objeto'
        });
        this.loadingData.set(false);
      }
    });
  }

  private loadCategorias() {
    this.api.get<any>('/categorias').subscribe({
      next: (response) => {
        const cats = response.data || response;
        this.categorias.set(cats);
        this.categoriasOptions.set(cats.map((c: Categoria) => ({ label: c.nombre, value: c.id.toString() })));
      }
    });
  }

  private loadAlmacenes() {
    this.api.get<Almacen[]>('/admin/almacenes').subscribe({
      next: (almacenes) => {
        this.almacenes.set(almacenes);
        this.almacenesOptions.set(almacenes.map(a => ({ label: a.nombre, value: a.id.toString() })));
      }
    });
  }

  onAlmacenChange() {
    if (!this.selectedAlmacenId) {
      this.ubicacionesFiltradas.set([]);
      this.ubicacionesOptions.set([]);
      this.formData.ubicacionAlmacenId = null;
      return;
    }

    const almacen = this.almacenes().find(a => a.id === +this.selectedAlmacenId!);
    const ubicaciones = almacen?.ubicaciones || [];
    this.ubicacionesFiltradas.set(ubicaciones);
    this.ubicacionesOptions.set(ubicaciones.map(u => ({ label: u.codigo, value: u.id.toString() })));
  }

  onFilesSelectedPrime(event: any) {
    if (event.files) {
      this.nuevasFotos = [...this.nuevasFotos, ...event.files].slice(0, 10);
    }
  }

  removerFoto(index: number) {
    this.nuevasFotos.splice(index, 1);
  }

  confirmarEliminarFoto(fotoId: number) {
    this.confirmationService.confirm({
      message: '¿Eliminar esta foto?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminarFoto(fotoId)
    });
  }

  eliminarFoto(fotoId: number) {
    const objetoId = this.route.snapshot.params['id'];
    this.api.delete(`/admin/objetos/${objetoId}/fotos/${fotoId}`).subscribe({
      next: () => {
        this.fotosExistentes.set(this.fotosExistentes().filter(f => f.id !== fotoId));
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminada',
          detail: 'Foto eliminada correctamente'
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Error al eliminar la foto'
        });
      }
    });
  }

  guardar() {
    // Convert dates to strings
    if (this.fechaHallazgoDate) {
      this.formData.fechaHallazgo = this.fechaHallazgoDate.toISOString().split('T')[0];
    }
    if (this.horaHallazgoDate) {
      this.formData.horaHallazgo = this.horaHallazgoDate.toTimeString().slice(0, 5);
    }

    if (!this.formData.titulo || !this.formData.categoriaId || !this.formData.fechaHallazgo ||
        !this.formData.direccionHallazgo || !this.formData.halladorNombre || !this.formData.halladorTelefono ||
        !this.selectedAlmacenId || !this.formData.ubicacionAlmacenId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Por favor, completa todos los campos obligatorios'
      });
      return;
    }

    this.saving.set(true);

    const formDataToSend = new FormData();
    Object.entries(this.formData).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        formDataToSend.append(key, value.toString());
      }
    });

    this.nuevasFotos.forEach((file, i) => {
      formDataToSend.append(`fotos[${i}]`, file);
    });

    const id = this.route.snapshot.params['id'];
    const request = id
      ? this.api.post(`/admin/objetos/${id}`, formDataToSend)
      : this.api.post('/admin/objetos', formDataToSend);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Guardado',
          detail: this.isEdit() ? 'Objeto actualizado correctamente' : 'Objeto registrado correctamente'
        });
        setTimeout(() => this.router.navigate(['/admin/objetos']), 1000);
      },
      error: (err) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Error al guardar'
        });
      }
    });
  }
}
