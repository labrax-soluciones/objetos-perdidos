import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

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
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="form-container">
      <div class="form-header">
        <h1>{{ isEdit() ? 'Editar objeto' : 'Registrar objeto' }}</h1>
        <a routerLink="/admin/objetos" class="btn-back">← Volver</a>
      </div>

      @if (loadingData()) {
        <div class="loading">Cargando...</div>
      } @else {
        @if (error()) {
          <div class="error-message">{{ error() }}</div>
        }

        <form (ngSubmit)="guardar()" class="objeto-form">
          <div class="form-section">
            <h2>Informacion basica</h2>

            <div class="form-row">
              <div class="form-group">
                <label for="tipo">Tipo *</label>
                <select id="tipo" [(ngModel)]="formData.tipo" name="tipo" required>
                  <option value="ENCONTRADO">Encontrado</option>
                  <option value="PERDIDO">Perdido</option>
                </select>
              </div>

              <div class="form-group">
                <label for="categoria">Categoria *</label>
                <select id="categoria" [(ngModel)]="formData.categoriaId" name="categoriaId" required>
                  <option value="">Selecciona categoria</option>
                  @for (cat of categorias(); track cat.id) {
                    <option [value]="cat.id">{{ cat.nombre }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="titulo">Titulo *</label>
              <input
                type="text"
                id="titulo"
                [(ngModel)]="formData.titulo"
                name="titulo"
                required
                placeholder="Descripcion breve del objeto"
              >
            </div>

            <div class="form-group">
              <label for="descripcion">Descripcion</label>
              <textarea
                id="descripcion"
                [(ngModel)]="formData.descripcion"
                name="descripcion"
                rows="4"
                placeholder="Descripcion detallada del objeto"
              ></textarea>
            </div>
          </div>

          <div class="form-section">
            <h2>Caracteristicas</h2>

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
                >
              </div>
            </div>

            <div class="form-group">
              <label for="valorEstimado">Valor estimado (€)</label>
              <input
                type="number"
                id="valorEstimado"
                [(ngModel)]="formData.valorEstimado"
                name="valorEstimado"
                min="0"
                step="0.01"
              >
            </div>
          </div>

          <div class="form-section">
            <h2>Hallazgo</h2>

            <div class="form-row">
              <div class="form-group">
                <label for="fechaHallazgo">Fecha de hallazgo *</label>
                <input
                  type="date"
                  id="fechaHallazgo"
                  [(ngModel)]="formData.fechaHallazgo"
                  name="fechaHallazgo"
                  required
                >
              </div>

              <div class="form-group">
                <label for="horaHallazgo">Hora</label>
                <input
                  type="time"
                  id="horaHallazgo"
                  [(ngModel)]="formData.horaHallazgo"
                  name="horaHallazgo"
                >
              </div>
            </div>

            <div class="form-group">
              <label for="direccionHallazgo">Direccion / Lugar de hallazgo *</label>
              <input
                type="text"
                id="direccionHallazgo"
                [(ngModel)]="formData.direccionHallazgo"
                name="direccionHallazgo"
                placeholder="Calle, zona o punto de referencia"
                required
              >
            </div>
          </div>

          <div class="form-section">
            <h2>Datos del hallador</h2>

            <div class="form-row">
              <div class="form-group">
                <label for="halladorNombre">Nombre completo *</label>
                <input
                  type="text"
                  id="halladorNombre"
                  [(ngModel)]="formData.halladorNombre"
                  name="halladorNombre"
                  placeholder="Nombre y apellidos de quien encuentra el objeto"
                  required
                >
              </div>

              <div class="form-group">
                <label for="halladorTelefono">Telefono *</label>
                <input
                  type="tel"
                  id="halladorTelefono"
                  [(ngModel)]="formData.halladorTelefono"
                  name="halladorTelefono"
                  placeholder="Telefono de contacto"
                  required
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="halladorDni">DNI / NIE</label>
                <input
                  type="text"
                  id="halladorDni"
                  [(ngModel)]="formData.halladorDni"
                  name="halladorDni"
                  placeholder="Documento de identidad (opcional)"
                >
              </div>
            </div>

            <div class="form-group">
              <label for="halladorObservaciones">Observaciones</label>
              <textarea
                id="halladorObservaciones"
                [(ngModel)]="formData.halladorObservaciones"
                name="halladorObservaciones"
                rows="3"
                placeholder="Circunstancias del hallazgo, estado del objeto, etc."
              ></textarea>
            </div>
          </div>

          <div class="form-section">
            <h2>Ubicacion en almacen</h2>

            <div class="form-row">
              <div class="form-group">
                <label for="almacen">Almacen *</label>
                <select
                  id="almacen"
                  [(ngModel)]="selectedAlmacenId"
                  name="almacenId"
                  (change)="onAlmacenChange()"
                  required
                >
                  <option value="">Selecciona almacen</option>
                  @for (almacen of almacenes(); track almacen.id) {
                    <option [value]="almacen.id">{{ almacen.nombre }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label for="ubicacion">Ubicacion *</label>
                <select
                  id="ubicacion"
                  [(ngModel)]="formData.ubicacionAlmacenId"
                  name="ubicacionAlmacenId"
                  [disabled]="!selectedAlmacenId"
                  required
                >
                  <option value="">Selecciona ubicacion</option>
                  @for (ub of ubicacionesFiltradas(); track ub.id) {
                    <option [value]="ub.id">{{ ub.codigo }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="estado">Estado</label>
              <select id="estado" [(ngModel)]="formData.estado" name="estado">
                <option value="REGISTRADO">Registrado</option>
                <option value="EN_ALMACEN">En almacen</option>
                <option value="RECLAMADO">Reclamado</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="SUBASTA">En subasta</option>
                <option value="DONADO">Donado</option>
                <option value="RECICLADO">Reciclado</option>
                <option value="DESTRUIDO">Destruido</option>
              </select>
            </div>
          </div>

          <div class="form-section">
            <h2>Fotos</h2>

            @if (fotosExistentes().length > 0) {
              <div class="fotos-existentes">
                @for (foto of fotosExistentes(); track foto.id) {
                  <div class="foto-item">
                    <img [src]="foto.thumbnailUrl || foto.url" alt="Foto">
                    <button type="button" class="btn-eliminar-foto" (click)="eliminarFoto(foto.id)">
                      &times;
                    </button>
                  </div>
                }
              </div>
            }

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

            @if (nuevasFotos.length > 0) {
              <div class="fotos-nuevas">
                <p>Fotos a subir:</p>
                @for (file of nuevasFotos; track file.name; let i = $index) {
                  <div class="file-item">
                    <span>{{ file.name }}</span>
                    <button type="button" (click)="removerFoto(i)">&times;</button>
                  </div>
                }
              </div>
            }
          </div>

          <div class="form-actions">
            <a routerLink="/admin/objetos" class="btn btn-outline">Cancelar</a>
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : (isEdit() ? 'Guardar cambios' : 'Registrar objeto') }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h1 {
      margin: 0;
    }

    .btn-back {
      color: #666;
      text-decoration: none;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .objeto-form {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .form-section {
      padding: 2rem;
      border-bottom: 1px solid #eee;
    }

    .form-section:last-of-type {
      border-bottom: none;
    }

    h2 {
      margin: 0 0 1.5rem;
      font-size: 1.125rem;
      color: #333;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
    }

    input, select, textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
      color: #333;
      background-color: white;
    }

    select option {
      color: #333;
      background-color: white;
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #667eea;
    }

    textarea {
      resize: vertical;
    }

    .fotos-existentes {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .foto-item {
      position: relative;
      width: 100px;
      height: 100px;
    }

    .foto-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
    }

    .btn-eliminar-foto {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      background: #e53935;
      color: white;
      font-size: 1rem;
      cursor: pointer;
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

    .fotos-nuevas {
      margin-top: 1rem;
    }

    .fotos-nuevas p {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.5rem;
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

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem 2rem;
      background: #f9f9f9;
      border-radius: 0 0 12px 12px;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-outline {
      background: white;
      border: 1px solid #ddd;
      color: #666;
    }

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    @media (max-width: 600px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ObjetoFormComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit = signal(false);
  loadingData = signal(true);
  saving = signal(false);
  error = signal('');

  categorias = signal<Categoria[]>([]);
  almacenes = signal<Almacen[]>([]);
  ubicacionesFiltradas = signal<Ubicacion[]>([]);
  fotosExistentes = signal<any[]>([]);

  selectedAlmacenId = '';
  nuevasFotos: File[] = [];

  formData = {
    tipo: 'ENCONTRADO',
    categoriaId: '',
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
    ubicacionAlmacenId: '',
    estado: 'REGISTRADO'
  };

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
      this.formData.fechaHallazgo = new Date().toISOString().split('T')[0];
    }
  }

  private loadObjeto(id: number) {
    this.api.get<any>(`/admin/objetos/${id}`).subscribe({
      next: (objeto) => {
        this.formData = {
          tipo: objeto.tipo,
          categoriaId: objeto.categoria?.id?.toString() || '',
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
          ubicacionAlmacenId: objeto.ubicacionAlmacen?.id?.toString() || '',
          estado: objeto.estado
        };
        if (objeto.ubicacionAlmacen?.almacen) {
          this.selectedAlmacenId = objeto.ubicacionAlmacen.almacen.id.toString();
          this.onAlmacenChange();
        }
        this.fotosExistentes.set(objeto.fotos || []);
        this.loadingData.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar el objeto');
        this.loadingData.set(false);
      }
    });
  }

  private loadCategorias() {
    this.api.get<any>('/categorias').subscribe({
      next: (response) => this.categorias.set(response.data || response)
    });
  }

  private loadAlmacenes() {
    this.api.get<Almacen[]>('/admin/almacenes').subscribe({
      next: (almacenes) => this.almacenes.set(almacenes)
    });
  }

  onAlmacenChange() {
    if (!this.selectedAlmacenId) {
      this.ubicacionesFiltradas.set([]);
      this.formData.ubicacionAlmacenId = '';
      return;
    }

    const almacen = this.almacenes().find(a => a.id === +this.selectedAlmacenId);
    this.ubicacionesFiltradas.set(almacen?.ubicaciones || []);
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.nuevasFotos = [...this.nuevasFotos, ...Array.from(input.files)].slice(0, 10);
    }
  }

  removerFoto(index: number) {
    this.nuevasFotos.splice(index, 1);
  }

  eliminarFoto(fotoId: number) {
    if (!confirm('¿Eliminar esta foto?')) return;

    const objetoId = this.route.snapshot.params['id'];
    this.api.delete(`/admin/objetos/${objetoId}/fotos/${fotoId}`).subscribe({
      next: () => {
        this.fotosExistentes.set(this.fotosExistentes().filter(f => f.id !== fotoId));
      }
    });
  }

  guardar() {
    this.error.set('');

    if (!this.formData.titulo || !this.formData.categoriaId || !this.formData.fechaHallazgo ||
        !this.formData.direccionHallazgo || !this.formData.halladorNombre || !this.formData.halladorTelefono ||
        !this.selectedAlmacenId || !this.formData.ubicacionAlmacenId) {
      this.error.set('Por favor, completa todos los campos obligatorios');
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
        this.router.navigate(['/admin/objetos']);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.message || 'Error al guardar');
      }
    });
  }
}
