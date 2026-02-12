import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ObjetoService } from '../../core/services/objeto.service';
import { Categoria } from '../../core/models';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-reportar-perdido',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InputTextModule, SelectModule, DatePickerModule, ButtonModule, ToastModule, FloatLabelModule, TextareaModule, CheckboxModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="max-w-2xl mx-auto p-8">
      <div class="bg-white p-8 rounded-lg shadow-lg">
        <h1 class="mb-2 text-gray-800 text-2xl font-bold">Reportar objeto perdido</h1>
        <p class="text-gray-500 mb-8">
          Completa el formulario con los datos de tu objeto perdido.
          Te notificaremos si encontramos alguna coincidencia.
        </p>

        @if (success()) {
          <div class="text-center p-8">
            <h2 class="text-green-600 font-bold text-xl mb-4">Reporte enviado</h2>
            <p class="text-gray-500 mb-6">{{ success() }}</p>
            <div class="flex gap-4 justify-center max-sm:flex-col">
              <a routerLink="/mis-objetos" class="px-6 py-3 rounded-md bg-primary text-white font-medium">Ver mis objetos</a>
              <a routerLink="/galeria" class="px-6 py-3 rounded-md bg-white border border-primary text-primary font-medium">Buscar en galeria</a>
            </div>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()">
            <div class="mb-5">
              <p-floatlabel>
                <input
                  pInputText
                  id="titulo"
                  [(ngModel)]="formData.titulo"
                  name="titulo"
                  class="w-full"
                />
                <label for="titulo">Titulo *</label>
              </p-floatlabel>
            </div>

            <div class="mb-5">
              <p-floatlabel>
                <p-select
                  id="categoriaId"
                  [(ngModel)]="formData.categoriaId"
                  name="categoriaId"
                  [options]="categorias()"
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Selecciona una categoria"
                  class="w-full"
                  styleClass="w-full"
                />
                <label for="categoriaId">Categoria *</label>
              </p-floatlabel>
            </div>

            <div class="mb-5">
              <p-floatlabel>
                <textarea
                  pTextarea
                  id="descripcion"
                  [(ngModel)]="formData.descripcion"
                  name="descripcion"
                  rows="4"
                  class="w-full"
                ></textarea>
                <label for="descripcion">Descripcion *</label>
              </p-floatlabel>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="mb-5">
                <p-floatlabel>
                  <input
                    pInputText
                    id="marca"
                    [(ngModel)]="formData.marca"
                    name="marca"
                    class="w-full"
                  />
                  <label for="marca">Marca</label>
                </p-floatlabel>
              </div>

              <div class="mb-5">
                <p-floatlabel>
                  <input
                    pInputText
                    id="modelo"
                    [(ngModel)]="formData.modelo"
                    name="modelo"
                    class="w-full"
                  />
                  <label for="modelo">Modelo</label>
                </p-floatlabel>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="mb-5">
                <p-floatlabel>
                  <input
                    pInputText
                    id="color"
                    [(ngModel)]="formData.color"
                    name="color"
                    class="w-full"
                  />
                  <label for="color">Color</label>
                </p-floatlabel>
              </div>

              <div class="mb-5">
                <p-floatlabel>
                  <input
                    pInputText
                    id="numeroSerie"
                    [(ngModel)]="formData.numeroSerie"
                    name="numeroSerie"
                    class="w-full"
                  />
                  <label for="numeroSerie">Numero de serie</label>
                </p-floatlabel>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="mb-5">
                <p-floatlabel>
                  <p-datepicker
                    id="fechaPerdida"
                    [(ngModel)]="fechaPerdidaDate"
                    name="fechaPerdida"
                    dateFormat="dd/mm/yy"
                    styleClass="w-full"
                    [showIcon]="true"
                  />
                  <label for="fechaPerdida">Fecha aproximada de perdida *</label>
                </p-floatlabel>
              </div>

              <div class="mb-5">
                <p-floatlabel>
                  <input
                    pInputText
                    id="horaPerdida"
                    [(ngModel)]="formData.horaPerdida"
                    name="horaPerdida"
                    type="time"
                    class="w-full"
                  />
                  <label for="horaPerdida">Hora aproximada</label>
                </p-floatlabel>
              </div>
            </div>

            <div class="mb-5">
              <p-floatlabel>
                <input
                  pInputText
                  id="direccionHallazgo"
                  [(ngModel)]="formData.direccionHallazgo"
                  name="direccionHallazgo"
                  class="w-full"
                />
                <label for="direccionHallazgo">Lugar donde lo perdiste</label>
              </p-floatlabel>
            </div>

            <div class="mb-5">
              <label class="block mb-2 font-medium">Fotos del objeto (opcional)</label>
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors" (click)="fileInput.click()">
                <input
                  #fileInput
                  type="file"
                  accept="image/*"
                  multiple
                  (change)="onFilesSelected($event)"
                  hidden
                >
                <span class="block text-3xl mb-2">📷</span>
                <span class="block">Haz clic para subir fotos</span>
                <small class="block text-gray-400 mt-2">JPG, PNG. Max 5MB por imagen</small>
              </div>
              @if (selectedFiles.length > 0) {
                <div class="mt-4">
                  @for (file of selectedFiles; track file.name; let i = $index) {
                    <div class="flex justify-between items-center p-2 bg-gray-100 rounded mb-2">
                      <span>{{ file.name }}</span>
                      <p-button icon="pi pi-times" [text]="true" severity="secondary" (onClick)="removeFile(i)" />
                    </div>
                  }
                </div>
              }
            </div>

            <div class="mb-5">
              <p-checkbox
                [(ngModel)]="crearAlerta"
                name="crearAlerta"
                [binary]="true"
                inputId="crearAlerta"
              />
              <label for="crearAlerta" class="ml-2 cursor-pointer">Crear alerta para recibir notificaciones si aparece un objeto similar</label>
            </div>

            <p-button
              type="submit"
              [label]="loading() ? 'Enviando...' : 'Enviar reporte'"
              [disabled]="loading()"
              styleClass="w-full"
            />
          </form>
        }
      </div>
    </div>
  `,
  styles: []
})
export class ReportarPerdidoComponent {
  private objetoService = inject(ObjetoService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  categorias = signal<Categoria[]>([]);
  loading = signal(false);
  error = signal('');
  success = signal('');

  formData = {
    titulo: '',
    descripcion: '',
    categoriaId: '',
    marca: '',
    modelo: '',
    color: '',
    numeroSerie: '',
    fechaPerdida: '',
    horaPerdida: '',
    direccionHallazgo: ''
  };

  fechaPerdidaDate: Date | null = null;

  selectedFiles: File[] = [];
  crearAlerta = true;

  constructor() {
    this.loadCategorias();
  }

  private loadCategorias() {
    this.objetoService.getCategorias().subscribe({
      next: (categorias) => this.categorias.set(categorias),
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      this.selectedFiles = [...this.selectedFiles, ...newFiles].slice(0, 5);
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  onSubmit() {
    this.error.set('');

    // Convert date to string format
    if (this.fechaPerdidaDate) {
      const date = this.fechaPerdidaDate;
      this.formData.fechaPerdida = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    if (!this.formData.titulo || !this.formData.descripcion || !this.formData.categoriaId || !this.formData.fechaPerdida) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, completa los campos obligatorios' });
      return;
    }

    this.loading.set(true);

    const formDataToSend = new FormData();
    formDataToSend.append('titulo', this.formData.titulo);
    formDataToSend.append('descripcion', this.formData.descripcion);
    formDataToSend.append('categoriaId', this.formData.categoriaId);
    formDataToSend.append('fechaPerdida', this.formData.fechaPerdida);

    if (this.formData.marca) formDataToSend.append('marca', this.formData.marca);
    if (this.formData.modelo) formDataToSend.append('modelo', this.formData.modelo);
    if (this.formData.color) formDataToSend.append('color', this.formData.color);
    if (this.formData.numeroSerie) formDataToSend.append('numeroSerie', this.formData.numeroSerie);
    if (this.formData.horaPerdida) formDataToSend.append('horaPerdida', this.formData.horaPerdida);
    if (this.formData.direccionHallazgo) formDataToSend.append('direccionHallazgo', this.formData.direccionHallazgo);
    formDataToSend.append('crearAlerta', this.crearAlerta.toString());

    this.selectedFiles.forEach((file, index) => {
      formDataToSend.append(`fotos[${index}]`, file);
    });

    this.objetoService.reportarPerdido(formDataToSend).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.success.set('Tu reporte ha sido registrado. Te notificaremos si encontramos alguna coincidencia.');
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message || 'Error al enviar el reporte' });
      }
    });
  }
}
