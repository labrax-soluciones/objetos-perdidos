import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ObjetoService } from '../../core/services/objeto.service';
import { Categoria } from '../../core/models';

@Component({
  selector: 'app-reportar-perdido',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="reportar-container">
      <div class="reportar-card">
        <h1>Reportar objeto perdido</h1>
        <p class="descripcion">
          Completa el formulario con los datos de tu objeto perdido.
          Te notificaremos si encontramos alguna coincidencia.
        </p>

        @if (success()) {
          <div class="success-message">
            <h2>Reporte enviado</h2>
            <p>{{ success() }}</p>
            <div class="success-actions">
              <a routerLink="/mis-objetos" class="btn btn-primary">Ver mis objetos</a>
              <a routerLink="/galeria" class="btn btn-outline">Buscar en galeria</a>
            </div>
          </div>
        } @else {
          @if (error()) {
            <div class="error-message">{{ error() }}</div>
          }

          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="titulo">Titulo *</label>
              <input
                type="text"
                id="titulo"
                [(ngModel)]="formData.titulo"
                name="titulo"
                placeholder="Ej: Cartera negra de cuero"
                required
              >
            </div>

            <div class="form-group">
              <label for="categoria">Categoria *</label>
              <select
                id="categoria"
                [(ngModel)]="formData.categoriaId"
                name="categoriaId"
                required
              >
                <option value="">Selecciona una categoria</option>
                @for (cat of categorias(); track cat.id) {
                  <option [value]="cat.id">{{ cat.nombre }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label for="descripcion">Descripcion *</label>
              <textarea
                id="descripcion"
                [(ngModel)]="formData.descripcion"
                name="descripcion"
                rows="4"
                placeholder="Describe el objeto con el mayor detalle posible: contenido, marcas identificativas, etc."
                required
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="marca">Marca</label>
                <input
                  type="text"
                  id="marca"
                  [(ngModel)]="formData.marca"
                  name="marca"
                  placeholder="Ej: Samsung, Nike..."
                >
              </div>

              <div class="form-group">
                <label for="modelo">Modelo</label>
                <input
                  type="text"
                  id="modelo"
                  [(ngModel)]="formData.modelo"
                  name="modelo"
                  placeholder="Ej: Galaxy S21..."
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="color">Color</label>
                <input
                  type="text"
                  id="color"
                  [(ngModel)]="formData.color"
                  name="color"
                  placeholder="Ej: Negro, Azul..."
                >
              </div>

              <div class="form-group">
                <label for="numeroSerie">Numero de serie</label>
                <input
                  type="text"
                  id="numeroSerie"
                  [(ngModel)]="formData.numeroSerie"
                  name="numeroSerie"
                  placeholder="Si lo conoces"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="fechaPerdida">Fecha aproximada de perdida *</label>
                <input
                  type="date"
                  id="fechaPerdida"
                  [(ngModel)]="formData.fechaPerdida"
                  name="fechaPerdida"
                  required
                >
              </div>

              <div class="form-group">
                <label for="horaPerdida">Hora aproximada</label>
                <input
                  type="time"
                  id="horaPerdida"
                  [(ngModel)]="formData.horaPerdida"
                  name="horaPerdida"
                >
              </div>
            </div>

            <div class="form-group">
              <label for="direccion">Lugar donde lo perdiste</label>
              <input
                type="text"
                id="direccion"
                [(ngModel)]="formData.direccionHallazgo"
                name="direccionHallazgo"
                placeholder="Calle, zona o lugar aproximado"
              >
            </div>

            <div class="form-group">
              <label>Fotos del objeto (opcional)</label>
              <div class="upload-area" (click)="fileInput.click()">
                <input
                  #fileInput
                  type="file"
                  accept="image/*"
                  multiple
                  (change)="onFilesSelected($event)"
                  hidden
                >
                <span class="upload-icon">📷</span>
                <span>Haz clic para subir fotos</span>
                <small>JPG, PNG. Max 5MB por imagen</small>
              </div>
              @if (selectedFiles.length > 0) {
                <div class="files-preview">
                  @for (file of selectedFiles; track file.name; let i = $index) {
                    <div class="file-item">
                      <span>{{ file.name }}</span>
                      <button type="button" (click)="removeFile(i)">&times;</button>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  [(ngModel)]="crearAlerta"
                  name="crearAlerta"
                >
                Crear alerta para recibir notificaciones si aparece un objeto similar
              </label>
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="loading()">
              {{ loading() ? 'Enviando...' : 'Enviar reporte' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .reportar-container {
      max-width: 700px;
      margin: 0 auto;
      padding: 2rem;
    }

    .reportar-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    h1 {
      margin-bottom: 0.5rem;
      color: #333;
    }

    .descripcion {
      color: #666;
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
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

    input, select, textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #667eea;
    }

    textarea {
      resize: vertical;
    }

    .upload-area {
      border: 2px dashed #ddd;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .upload-area:hover {
      border-color: #667eea;
    }

    .upload-icon {
      display: block;
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .upload-area small {
      display: block;
      color: #999;
      margin-top: 0.5rem;
    }

    .files-preview {
      margin-top: 1rem;
    }

    .file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      background: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }

    .file-item button {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #999;
    }

    .checkbox-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: normal;
      cursor: pointer;
    }

    .checkbox-group input {
      width: auto;
    }

    .btn {
      width: 100%;
      padding: 0.875rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      display: block;
      text-align: center;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #5a6fd6;
    }

    .btn-outline {
      background: white;
      border: 1px solid #667eea;
      color: #667eea;
    }

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .error-message {
      background: #fee;
      color: #c00;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      text-align: center;
    }

    .success-message {
      text-align: center;
      padding: 2rem;
    }

    .success-message h2 {
      color: #080;
      margin-bottom: 1rem;
    }

    .success-message p {
      color: #666;
      margin-bottom: 1.5rem;
    }

    .success-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .success-actions .btn {
      width: auto;
      padding: 0.75rem 1.5rem;
    }

    @media (max-width: 600px) {
      .form-row {
        grid-template-columns: 1fr;
      }

      .success-actions {
        flex-direction: column;
      }
    }
  `]
})
export class ReportarPerdidoComponent {
  private objetoService = inject(ObjetoService);
  private router = inject(Router);

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

    if (!this.formData.titulo || !this.formData.descripcion || !this.formData.categoriaId || !this.formData.fechaPerdida) {
      this.error.set('Por favor, completa los campos obligatorios');
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
        this.error.set(err.message || 'Error al enviar el reporte');
      }
    });
  }
}
