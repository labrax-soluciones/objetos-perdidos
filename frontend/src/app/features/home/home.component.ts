import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ObjetoService } from '../../core/services/objeto.service';
import { Objeto, Categoria } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-gradient-primary text-white py-20 px-5 text-center">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl font-bold mb-4">Portal de Objetos Perdidos</h1>
        <p class="text-xl mb-8 opacity-90">Encuentra lo que has perdido o ayuda a otros a recuperar sus pertenencias</p>
        <div class="flex gap-4 justify-center flex-wrap">
          <a routerLink="/galeria" class="inline-block px-6 py-3 rounded-md bg-primary text-white font-medium hover:bg-primary-dark transition-colors">Ver objetos encontrados</a>
          <a routerLink="/reportar-perdido" class="inline-block px-6 py-3 rounded-md bg-white text-primary font-medium hover:bg-gray-100 transition-colors">Reportar objeto perdido</a>
        </div>
      </div>
    </div>

    <section class="py-16 px-5">
      <div class="max-w-6xl mx-auto">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <a routerLink="/mis-objetos" [queryParams]="{accion: 'perdido'}" class="flex flex-col items-center p-8 rounded-xl text-white text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-red-500 to-red-700">
            <span class="text-5xl mb-4">🔍</span>
            <h3 class="text-xl font-semibold mb-2">He perdido un objeto</h3>
            <p class="opacity-90 text-sm">Registra tu objeto perdido y te avisaremos si aparece</p>
          </a>
          <a routerLink="/mis-objetos" [queryParams]="{accion: 'encontrado'}" class="flex flex-col items-center p-8 rounded-xl text-white text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-green-500 to-green-700">
            <span class="text-5xl mb-4">📦</span>
            <h3 class="text-xl font-semibold mb-2">He encontrado un objeto</h3>
            <p class="opacity-90 text-sm">Entrega el objeto para que su dueño pueda recuperarlo</p>
          </a>
        </div>

        <h2 class="text-center mb-8 text-gray-800 text-2xl font-bold">Últimos objetos encontrados</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (objeto of objetosRecientes; track objeto.id) {
            <div class="bg-white rounded-lg overflow-hidden shadow-md transition-transform duration-200 hover:-translate-y-1">
              <div class="h-44 bg-gray-100">
                @if (objeto.fotoPrincipal?.thumbnailUrl) {
                  <img [src]="objeto.fotoPrincipal!.thumbnailUrl" [alt]="objeto.titulo" class="w-full h-full object-cover">
                } @else {
                  <div class="h-full flex items-center justify-center text-gray-400">Sin imagen</div>
                }
              </div>
              <div class="p-4">
                <h3 class="mb-2 font-semibold text-base">{{ objeto.titulo }}</h3>
                @if (objeto.categoria) {
                  <span class="inline-block bg-gray-200 px-2 py-0.5 rounded text-xs">{{ objeto.categoria.nombre }}</span>
                }
                <p class="text-gray-500 text-sm my-2">{{ objeto.createdAt | date:'dd/MM/yyyy' }}</p>
                <a [routerLink]="['/objeto', objeto.id]" class="inline-block px-4 py-2 text-sm rounded bg-primary text-white hover:bg-primary-dark transition-colors">Ver detalles</a>
              </div>
            </div>
          }
        </div>
        <div class="text-center mt-8">
          <a routerLink="/galeria" class="inline-block px-6 py-3 rounded-md bg-transparent border-2 border-primary text-primary font-medium hover:bg-primary hover:text-white transition-colors">Ver todos los objetos</a>
        </div>
      </div>
    </section>

    <section class="py-16 px-5 bg-gray-50">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-center mb-8 text-gray-800 text-2xl font-bold">Categorias</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          @for (categoria of categorias; track categoria.id) {
            <a [routerLink]="['/galeria']" [queryParams]="{categoria: categoria.id}" class="flex flex-col items-center p-6 bg-white rounded-lg text-gray-800 transition-colors duration-200 hover:bg-primary hover:text-white">
              <span class="text-3xl mb-2">{{ categoria.icono || '📦' }}</span>
              <span class="font-medium text-sm text-center">{{ categoria.nombre }}</span>
            </a>
          }
        </div>
      </div>
    </section>

    <section class="py-16 px-5">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-center mb-8 text-gray-800 text-2xl font-bold">Como funciona</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div class="text-center p-8">
            <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
            <h3 class="text-lg font-semibold mb-2">Busca tu objeto</h3>
            <p class="text-gray-600">Explora la galeria de objetos encontrados o usa el buscador</p>
          </div>
          <div class="text-center p-8">
            <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
            <h3 class="text-lg font-semibold mb-2">Identifica el tuyo</h3>
            <p class="text-gray-600">Si encuentras tu objeto, solicita su recuperacion</p>
          </div>
          <div class="text-center p-8">
            <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
            <h3 class="text-lg font-semibold mb-2">Recuperalo</h3>
            <p class="text-gray-600">Agenda una cita o solicita el envio a tu domicilio</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: []
})
export class HomeComponent implements OnInit {
  private objetoService = inject(ObjetoService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  objetosRecientes: Objeto[] = [];
  categorias: Categoria[] = [];

  ngOnInit() {
    this.loadObjetosFetch();
    this.loadCategorias();
  }

  private async loadObjetosFetch() {
    try {
      const response = await fetch('http://localhost:8088/api/objetos?limit=20');
      const data = await response.json();
      this.objetosRecientes = (data.data || [])
        .filter((obj: any) => obj.titulo && obj.fotoPrincipal)
        .slice(0, 10);
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Error loading objects:', err);
    }
  }

  private loadCategorias() {
    this.objetoService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias.slice(0, 8);
      },
      error: (err) => console.error('Error loading categories:', err)
    });
  }
}
