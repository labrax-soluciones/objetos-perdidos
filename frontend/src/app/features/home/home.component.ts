import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ObjetoService } from '../../core/services/objeto.service';
import { Objeto, Categoria } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="hero">
      <div class="hero-content">
        <h1>Portal de Objetos Perdidos</h1>
        <p>Encuentra lo que has perdido o ayuda a otros a recuperar sus pertenencias</p>
        <div class="hero-actions">
          <a routerLink="/galeria" class="btn btn-primary">Ver objetos encontrados</a>
          <a routerLink="/reportar-perdido" class="btn btn-secondary">Reportar objeto perdido</a>
        </div>
      </div>
    </div>

    <section class="section">
      <div class="container">
        <div class="acciones-ciudadano">
          <a routerLink="/mis-objetos" [queryParams]="{accion: 'perdido'}" class="accion-card perdido">
            <span class="accion-icono">🔍</span>
            <h3>He perdido un objeto</h3>
            <p>Registra tu objeto perdido y te avisaremos si aparece</p>
          </a>
          <a routerLink="/mis-objetos" [queryParams]="{accion: 'encontrado'}" class="accion-card encontrado">
            <span class="accion-icono">📦</span>
            <h3>He encontrado un objeto</h3>
            <p>Entrega el objeto para que su dueño pueda recuperarlo</p>
          </a>
        </div>

        <h2>Ultimos objetos encontrados</h2>
        <div class="objetos-grid">
          @for (objeto of objetosRecientes; track objeto.id) {
            <div class="objeto-card">
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
                <p class="fecha">{{ objeto.createdAt | date:'dd/MM/yyyy' }}</p>
                <a [routerLink]="['/objeto', objeto.id]" class="btn btn-small">Ver detalles</a>
              </div>
            </div>
          }
        </div>
        <div class="ver-mas">
          <a routerLink="/galeria" class="btn btn-outline">Ver todos los objetos</a>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <h2>Categorias</h2>
        <div class="categorias-grid">
          @for (categoria of categorias; track categoria.id) {
            <a [routerLink]="['/galeria']" [queryParams]="{categoria: categoria.id}" class="categoria-card">
              <span class="categoria-icono">{{ categoria.icono || '📦' }}</span>
              <span class="categoria-nombre">{{ categoria.nombre }}</span>
            </a>
          }
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2>Como funciona</h2>
        <div class="pasos-grid">
          <div class="paso">
            <div class="paso-numero">1</div>
            <h3>Busca tu objeto</h3>
            <p>Explora la galeria de objetos encontrados o usa el buscador</p>
          </div>
          <div class="paso">
            <div class="paso-numero">2</div>
            <h3>Identifica el tuyo</h3>
            <p>Si encuentras tu objeto, solicita su recuperacion</p>
          </div>
          <div class="paso">
            <div class="paso-numero">3</div>
            <h3>Recuperalo</h3>
            <p>Agenda una cita o solicita el envio a tu domicilio</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 80px 20px;
      text-align: center;
    }

    .hero h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .hero p {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .section {
      padding: 60px 20px;
    }

    .section-alt {
      background-color: #f8f9fa;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    h2 {
      text-align: center;
      margin-bottom: 2rem;
      color: #333;
    }

    .objetos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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

    .objeto-imagen {
      height: 180px;
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
      font-size: 1rem;
    }

    .categoria {
      display: inline-block;
      background: #e0e0e0;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .fecha {
      color: #666;
      font-size: 0.875rem;
      margin: 0.5rem 0;
    }

    .ver-mas {
      text-align: center;
      margin-top: 2rem;
    }

    .categorias-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }

    .categoria-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      background: white;
      border-radius: 8px;
      text-decoration: none;
      color: #333;
      transition: background 0.2s;
    }

    .categoria-card:hover {
      background: #667eea;
      color: white;
    }

    .categoria-icono {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .categoria-nombre {
      font-weight: 500;
    }

    .pasos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .paso {
      text-align: center;
      padding: 2rem;
    }

    .paso-numero {
      width: 50px;
      height: 50px;
      background: #667eea;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: bold;
      margin: 0 auto 1rem;
    }

    .btn {
      display: inline-block;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      transition: background 0.2s;
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a6fd6;
    }

    .btn-secondary {
      background: white;
      color: #667eea;
    }

    .btn-secondary:hover {
      background: #f0f0f0;
    }

    .btn-outline {
      background: transparent;
      border: 2px solid #667eea;
      color: #667eea;
    }

    .btn-outline:hover {
      background: #667eea;
      color: white;
    }

    .btn-small {
      padding: 8px 16px;
      font-size: 0.875rem;
    }

    .acciones-ciudadano {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .accion-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      border-radius: 12px;
      text-decoration: none;
      color: white;
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .accion-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    }

    .accion-card.perdido {
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    }

    .accion-card.encontrado {
      background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%);
    }

    .accion-icono {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .accion-card h3 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
    }

    .accion-card p {
      margin: 0;
      opacity: 0.9;
      font-size: 0.9rem;
    }
  `]
})
export class HomeComponent implements OnInit {
  private objetoService = inject(ObjetoService);

  objetosRecientes: Objeto[] = [];
  categorias: Categoria[] = [];

  ngOnInit() {
    this.loadObjetos();
    this.loadCategorias();
  }

  private loadObjetos() {
    this.objetoService.getObjetos({ limit: 20 }).subscribe({
      next: (response) => {
        // Filter out objects without title and photos, take first 10
        this.objetosRecientes = (response.data || [])
          .filter(obj => obj.titulo && obj.fotoPrincipal)
          .slice(0, 10);
      },
      error: (err) => console.error('Error loading objects:', err)
    });
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
