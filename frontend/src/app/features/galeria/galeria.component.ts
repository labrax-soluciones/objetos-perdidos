import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ObjetoService } from '../../core/services/objeto.service';
import { Objeto, Categoria, ObjetosFilter } from '../../core/models';

@Component({
  selector: 'app-galeria',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="galeria-container">
      <div class="filtros-panel">
        <h3>Filtros</h3>

        <div class="filtro-group">
          <label>Buscar</label>
          <input
            type="text"
            [(ngModel)]="filtros.q"
            placeholder="Buscar..."
            (keyup.enter)="buscar()"
          >
        </div>

        <div class="filtro-group">
          <label>Categoria</label>
          <select [(ngModel)]="filtros.categoria" (change)="buscar()">
            <option [ngValue]="undefined">Todas</option>
            @for (cat of categorias(); track cat.id) {
              <option [ngValue]="cat.id">{{ cat.nombre }}</option>
            }
          </select>
        </div>

        <div class="filtro-group">
          <label>Color</label>
          <input
            type="text"
            [(ngModel)]="filtros.color"
            placeholder="Ej: rojo, azul..."
          >
        </div>

        <div class="filtro-group">
          <label>Fecha desde</label>
          <input
            type="date"
            [(ngModel)]="filtros.fechaDesde"
          >
        </div>

        <div class="filtro-group">
          <label>Fecha hasta</label>
          <input
            type="date"
            [(ngModel)]="filtros.fechaHasta"
          >
        </div>

        <button class="btn btn-primary" (click)="buscar()">Buscar</button>
        <button class="btn btn-outline" (click)="limpiarFiltros()">Limpiar</button>
      </div>

      <div class="resultados">
        <div class="resultados-header">
          <h2>Objetos encontrados</h2>
          <span class="total">{{ total() }} resultados</span>
        </div>

        @if (loading()) {
          <div class="loading">Cargando...</div>
        } @else if (objetos().length === 0) {
          <div class="no-results">
            <p>No se encontraron objetos con los filtros seleccionados.</p>
          </div>
        } @else {
          <div class="objetos-grid">
            @for (objeto of objetos(); track objeto.id) {
              <div class="objeto-card">
                <a [routerLink]="['/objeto', objeto.id]">
                  <div class="objeto-imagen">
                    @if (objeto.fotoPrincipal?.thumbnailUrl) {
                      <img [src]="objeto.fotoPrincipal!.thumbnailUrl" [alt]="objeto.titulo">
                    } @else {
                      <div class="no-imagen">Sin imagen</div>
                    }
                  </div>
                  <div class="objeto-info">
                    <h3>{{ objeto.titulo }}</h3>
                    @if (objeto.categoria) {
                      <span class="categoria">{{ objeto.categoria.nombre }}</span>
                    }
                    @if (objeto.color) {
                      <span class="color">{{ objeto.color }}</span>
                    }
                    <p class="fecha">{{ objeto.createdAt | date:'dd/MM/yyyy' }}</p>
                  </div>
                </a>
              </div>
            }
          </div>

          @if (totalPages() > 1) {
            <div class="paginacion">
              <button
                [disabled]="currentPage() <= 1"
                (click)="cambiarPagina(currentPage() - 1)"
              >
                Anterior
              </button>
              <span>Pagina {{ currentPage() }} de {{ totalPages() }}</span>
              <button
                [disabled]="currentPage() >= totalPages()"
                (click)="cambiarPagina(currentPage() + 1)"
              >
                Siguiente
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .galeria-container {
      display: flex;
      gap: 2rem;
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .filtros-panel {
      width: 280px;
      flex-shrink: 0;
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      height: fit-content;
      position: sticky;
      top: 2rem;
    }

    .filtros-panel h3 {
      margin: 0 0 1.5rem;
    }

    .filtro-group {
      margin-bottom: 1rem;
    }

    .filtro-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .filtro-group input,
    .filtro-group select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .resultados {
      flex: 1;
    }

    .resultados-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .resultados-header h2 {
      margin: 0;
    }

    .total {
      color: #666;
    }

    .objetos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.5rem;
    }

    .objeto-card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }

    .objeto-card:hover {
      transform: translateY(-4px);
    }

    .objeto-card a {
      text-decoration: none;
      color: inherit;
    }

    .objeto-imagen {
      height: 160px;
      background: #f0f0f0;
    }

    .objeto-imagen img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-imagen {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }

    .objeto-info {
      padding: 1rem;
    }

    .objeto-info h3 {
      margin: 0 0 0.5rem;
      font-size: 0.95rem;
    }

    .categoria, .color {
      display: inline-block;
      background: #e0e0e0;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-right: 0.5rem;
    }

    .fecha {
      color: #666;
      font-size: 0.8rem;
      margin: 0.5rem 0 0;
    }

    .paginacion {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
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

    .loading, .no-results {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .btn {
      display: block;
      width: 100%;
      padding: 0.75rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      margin-top: 0.5rem;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-outline {
      background: white;
      border: 1px solid #ddd;
      color: #333;
    }

    @media (max-width: 768px) {
      .galeria-container {
        flex-direction: column;
      }

      .filtros-panel {
        width: 100%;
        position: static;
      }
    }
  `]
})
export class GaleriaComponent implements OnInit {
  private objetoService = inject(ObjetoService);
  private route = inject(ActivatedRoute);

  objetos = signal<Objeto[]>([]);
  categorias = signal<Categoria[]>([]);
  loading = signal(true);
  total = signal(0);
  currentPage = signal(1);
  totalPages = signal(1);

  filtros: ObjetosFilter = {
    limit: 20
  };

  ngOnInit() {
    this.loadCategorias();

    this.route.queryParams.subscribe(params => {
      if (params['categoria']) {
        this.filtros.categoria = +params['categoria'];
      }
      this.loadObjetos();
    });
  }

  loadObjetos() {
    this.loading.set(true);
    this.filtros.page = this.currentPage();

    this.objetoService.getObjetos(this.filtros).subscribe({
      next: (response) => {
        this.objetos.set(response.data);
        this.total.set(response.meta.total);
        this.totalPages.set(response.meta.pages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadCategorias() {
    this.objetoService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
      }
    });
  }

  buscar() {
    this.currentPage.set(1);
    this.loadObjetos();
  }

  limpiarFiltros() {
    this.filtros = { limit: 20 };
    this.currentPage.set(1);
    this.loadObjetos();
  }

  cambiarPagina(page: number) {
    this.currentPage.set(page);
    this.loadObjetos();
  }
}
