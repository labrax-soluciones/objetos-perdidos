import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ObjetoService } from '../../core/services/objeto.service';
import { Objeto, Categoria, ObjetosFilter } from '../../core/models';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-galeria',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, InputTextModule, SelectModule, DatePickerModule, ButtonModule, ToastModule, FloatLabelModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="flex gap-8 p-8 max-w-7xl mx-auto max-md:flex-col">
      <div class="w-72 flex-shrink-0 bg-gray-50 p-6 rounded-lg h-fit sticky top-8 max-md:w-full max-md:static">
        <h3 class="mb-6 font-semibold text-lg">Filtros</h3>

        <div class="mb-4">
          <p-floatlabel>
            <input
              pInputText
              id="buscar"
              [(ngModel)]="filtros.q"
              (keyup.enter)="buscar()"
              class="w-full"
            />
            <label for="buscar">Buscar</label>
          </p-floatlabel>
        </div>

        <div class="mb-4">
          <p-floatlabel>
            <p-select
              id="categoria"
              [(ngModel)]="filtros.categoria"
              [options]="categoriasOptions()"
              optionLabel="nombre"
              optionValue="id"
              (onChange)="buscar()"
              class="w-full"
              styleClass="w-full"
            />
            <label for="categoria">Categoria</label>
          </p-floatlabel>
        </div>

        <div class="mb-4">
          <p-floatlabel>
            <input
              pInputText
              id="color"
              [(ngModel)]="filtros.color"
              class="w-full"
            />
            <label for="color">Color</label>
          </p-floatlabel>
        </div>

        <div class="mb-4">
          <p-floatlabel>
            <p-datepicker
              id="fechaDesde"
              [(ngModel)]="fechaDesdeDate"
              dateFormat="dd/mm/yy"
              styleClass="w-full"
              [showIcon]="true"
            />
            <label for="fechaDesde">Fecha desde</label>
          </p-floatlabel>
        </div>

        <div class="mb-4">
          <p-floatlabel>
            <p-datepicker
              id="fechaHasta"
              [(ngModel)]="fechaHastaDate"
              dateFormat="dd/mm/yy"
              styleClass="w-full"
              [showIcon]="true"
            />
            <label for="fechaHasta">Fecha hasta</label>
          </p-floatlabel>
        </div>

        <p-button label="Buscar" (onClick)="buscar()" styleClass="w-full mb-2" />
        <p-button label="Limpiar" (onClick)="limpiarFiltros()" severity="secondary" [outlined]="true" styleClass="w-full" />
      </div>

      <div class="flex-1">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">Objetos encontrados</h2>
          <span class="text-gray-500">{{ total() }} resultados</span>
        </div>

        @if (loading()) {
          <div class="text-center py-12 text-gray-500">Cargando...</div>
        } @else if (objetos().length === 0) {
          <div class="text-center py-12 text-gray-500">
            <p>No se encontraron objetos con los filtros seleccionados.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (objeto of objetos(); track objeto.id) {
              <div class="bg-white rounded-lg overflow-hidden shadow-md transition-transform duration-200 hover:-translate-y-1">
                <a [routerLink]="['/objeto', objeto.id]" class="block text-inherit">
                  <div class="h-40 bg-gray-100">
                    @if (objeto.fotoPrincipal?.thumbnailUrl) {
                      <img [src]="objeto.fotoPrincipal!.thumbnailUrl" [alt]="objeto.titulo" class="w-full h-full object-cover">
                    } @else {
                      <div class="h-full flex items-center justify-center text-gray-400">Sin imagen</div>
                    }
                  </div>
                  <div class="p-4">
                    <h3 class="mb-2 font-semibold text-sm">{{ objeto.titulo }}</h3>
                    @if (objeto.categoria) {
                      <span class="inline-block bg-gray-200 px-2 py-0.5 rounded text-xs mr-2">{{ objeto.categoria.nombre }}</span>
                    }
                    @if (objeto.color) {
                      <span class="inline-block bg-gray-200 px-2 py-0.5 rounded text-xs">{{ objeto.color }}</span>
                    }
                    <p class="text-gray-500 text-xs mt-2">{{ objeto.createdAt | date:'dd/MM/yyyy' }}</p>
                  </div>
                </a>
              </div>
            }
          </div>

          @if (totalPages() > 1) {
            <div class="flex justify-center items-center gap-4 mt-8">
              <p-button
                label="Anterior"
                [disabled]="currentPage() <= 1"
                (onClick)="cambiarPagina(currentPage() - 1)"
                severity="secondary"
                [outlined]="true"
              />
              <span>Pagina {{ currentPage() }} de {{ totalPages() }}</span>
              <p-button
                label="Siguiente"
                [disabled]="currentPage() >= totalPages()"
                (onClick)="cambiarPagina(currentPage() + 1)"
                severity="secondary"
                [outlined]="true"
              />
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: []
})
export class GaleriaComponent implements OnInit {
  private objetoService = inject(ObjetoService);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  objetos = signal<Objeto[]>([]);
  categorias = signal<Categoria[]>([]);
  loading = signal(true);
  total = signal(0);
  currentPage = signal(1);
  totalPages = signal(1);

  fechaDesdeDate: Date | null = null;
  fechaHastaDate: Date | null = null;

  filtros: ObjetosFilter = {
    limit: 20
  };

  categoriasOptions = signal<{id: number | undefined, nombre: string}[]>([]);

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
        this.categoriasOptions.set([
          { id: undefined, nombre: 'Todas' },
          ...categorias.map(c => ({ id: c.id, nombre: c.nombre }))
        ]);
      }
    });
  }

  buscar() {
    // Convert dates to string format
    if (this.fechaDesdeDate) {
      const date = this.fechaDesdeDate;
      this.filtros.fechaDesde = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } else {
      this.filtros.fechaDesde = undefined;
    }
    if (this.fechaHastaDate) {
      const date = this.fechaHastaDate;
      this.filtros.fechaHasta = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } else {
      this.filtros.fechaHasta = undefined;
    }
    this.currentPage.set(1);
    this.loadObjetos();
  }

  limpiarFiltros() {
    this.filtros = { limit: 20 };
    this.fechaDesdeDate = null;
    this.fechaHastaDate = null;
    this.currentPage.set(1);
    this.loadObjetos();
  }

  cambiarPagina(page: number) {
    this.currentPage.set(page);
    this.loadObjetos();
  }
}
