import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface Objeto {
  id: number;
  codigoUnico: string;
  titulo: string;
  tipo: string;
  estado: string;
  categoria?: { nombre: string };
  ubicacionAlmacen?: { codigo: string };
  createdAt: string;
  fotoPrincipal?: { thumbnailUrl: string };
}

@Component({
  selector: 'app-objetos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="objetos-admin-container">
      <div class="header">
        <h1>Gestion de objetos</h1>
        <a routerLink="/admin/objetos/nuevo" class="btn btn-primary">
          + Nuevo objeto
        </a>
      </div>

      <div class="filtros">
        <div class="filtros-row">
          <input
            type="text"
            [(ngModel)]="filtros.busqueda"
            placeholder="Buscar por titulo, codigo..."
            (keyup.enter)="buscar()"
          >
          <select [(ngModel)]="filtros.tipo" (change)="buscar()">
            <option value="">Todos los tipos</option>
            <option value="ENCONTRADO">Encontrado</option>
            <option value="PERDIDO">Perdido</option>
          </select>
          <select [(ngModel)]="filtros.estado" (change)="buscar()">
            <option value="">Todos los estados</option>
            <option value="REGISTRADO">Registrado</option>
            <option value="EN_ALMACEN">En almacen</option>
            <option value="RECLAMADO">Reclamado</option>
            <option value="ENTREGADO">Entregado</option>
            <option value="SUBASTA">Subasta</option>
            <option value="DONADO">Donado</option>
          </select>
          <button class="btn btn-outline" (click)="buscar()">Buscar</button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading">Cargando objetos...</div>
      } @else if (objetos().length === 0) {
        <div class="empty-state">
          <p>No se encontraron objetos</p>
        </div>
      } @else {
        <div class="tabla-container">
          <table class="tabla">
            <thead>
              <tr>
                <th>Objeto</th>
                <th>Codigo</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Estado</th>
                <th>Ubicacion</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (objeto of objetos(); track objeto.id) {
                <tr>
                  <td class="td-objeto">
                    <div class="objeto-cell">
                      @if (objeto.fotoPrincipal) {
                        <img [src]="objeto.fotoPrincipal.thumbnailUrl" [alt]="objeto.titulo">
                      } @else {
                        <div class="no-img">📦</div>
                      }
                      <span>{{ objeto.titulo }}</span>
                    </div>
                  </td>
                  <td><code>{{ objeto.codigoUnico }}</code></td>
                  <td>
                    <span class="tipo-badge" [class]="'tipo-' + objeto.tipo.toLowerCase()">
                      {{ objeto.tipo }}
                    </span>
                  </td>
                  <td>{{ objeto.categoria?.nombre || '-' }}</td>
                  <td>
                    <span class="estado-badge" [class]="'estado-' + objeto.estado.toLowerCase()">
                      {{ objeto.estado }}
                    </span>
                  </td>
                  <td>{{ objeto.ubicacionAlmacen?.codigo || '-' }}</td>
                  <td>{{ objeto.createdAt | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <div class="acciones">
                      <a [routerLink]="['/admin/objetos', objeto.id]" class="btn-icon" title="Editar">
                        ✏️
                      </a>
                      <button class="btn-icon" (click)="generarQR(objeto)" title="Generar QR">
                        📱
                      </button>
                      <button class="btn-icon" (click)="eliminar(objeto)" title="Eliminar">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="paginacion">
          <button
            [disabled]="pagina() === 1"
            (click)="irAPagina(pagina() - 1)"
          >
            Anterior
          </button>
          <span>Pagina {{ pagina() }} de {{ totalPaginas() }}</span>
          <button
            [disabled]="pagina() === totalPaginas()"
            (click)="irAPagina(pagina() + 1)"
          >
            Siguiente
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .objetos-admin-container {
      padding: 2rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h1 {
      margin: 0;
    }

    .filtros {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .filtros-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .filtros input, .filtros select {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .filtros input {
      flex: 1;
      min-width: 200px;
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
      overflow: hidden;
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

    .td-objeto {
      min-width: 200px;
    }

    .objeto-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .objeto-cell img {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      object-fit: cover;
    }

    .no-img {
      width: 40px;
      height: 40px;
      background: #f0f0f0;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .tipo-badge, .estado-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .tipo-encontrado { background: #e8f5e9; color: #388e3c; }
    .tipo-perdido { background: #ffebee; color: #c62828; }

    .estado-registrado { background: #e3f2fd; color: #1976d2; }
    .estado-en_almacen { background: #fff3e0; color: #f57c00; }
    .estado-reclamado { background: #fff9c4; color: #f9a825; }
    .estado-entregado { background: #e8f5e9; color: #388e3c; }
    .estado-subasta { background: #fce4ec; color: #c2185b; }
    .estado-donado { background: #f3e5f5; color: #7b1fa2; }

    .acciones {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      padding: 0.25rem;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .btn-icon:hover {
      opacity: 1;
    }

    a.btn-icon {
      text-decoration: none;
    }

    .paginacion {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .paginacion button {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
    }

    .paginacion button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
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
      border: 1px solid #667eea;
      color: #667eea;
    }

    @media (max-width: 1024px) {
      .tabla-container {
        overflow-x: auto;
      }
    }
  `]
})
export class ObjetosAdminComponent implements OnInit {
  private api = inject(ApiService);

  objetos = signal<Objeto[]>([]);
  loading = signal(true);
  pagina = signal(1);
  totalPaginas = signal(1);

  filtros = {
    busqueda: '',
    tipo: '',
    estado: ''
  };

  ngOnInit() {
    this.buscar();
  }

  buscar() {
    this.loading.set(true);
    const params = new URLSearchParams();
    if (this.filtros.busqueda) params.append('q', this.filtros.busqueda);
    if (this.filtros.tipo) params.append('tipo', this.filtros.tipo);
    if (this.filtros.estado) params.append('estado', this.filtros.estado);
    params.append('page', this.pagina().toString());

    this.api.get<any>(`/admin/objetos?${params}`).subscribe({
      next: (response) => {
        this.objetos.set(response.data || []);
        this.totalPaginas.set(response.meta?.pages || 1);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  irAPagina(pagina: number) {
    this.pagina.set(pagina);
    this.buscar();
  }

  generarQR(objeto: Objeto) {
    this.api.post(`/admin/objetos/${objeto.id}/qr`, {}).subscribe({
      next: (response: any) => {
        if (response.qrUrl) {
          window.open(response.qrUrl, '_blank');
        }
      },
      error: (err) => {
        alert(err.message || 'Error al generar QR');
      }
    });
  }

  eliminar(objeto: Objeto) {
    if (!confirm(`¿Seguro que quieres eliminar "${objeto.titulo}"?`)) return;

    this.api.delete(`/admin/objetos/${objeto.id}`).subscribe({
      next: () => {
        this.objetos.set(this.objetos().filter(o => o.id !== objeto.id));
      },
      error: (err) => {
        alert(err.message || 'Error al eliminar');
      }
    });
  }
}
