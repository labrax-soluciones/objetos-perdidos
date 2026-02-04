import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ObjetoService } from '../../core/services/objeto.service';
import { AuthService } from '../../core/services/auth.service';
import { Objeto } from '../../core/models';

@Component({
  selector: 'app-objeto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="detalle-container">
      @if (loading()) {
        <div class="loading">Cargando...</div>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else if (objeto()) {
        <div class="detalle-content">
          <div class="galeria">
            <div class="imagen-principal">
              @if (imagenActual()) {
                <img [src]="imagenActual()" [alt]="objeto()!.titulo">
              } @else {
                <div class="no-imagen">Sin imagen</div>
              }
            </div>
            @if (objeto()!.fotos && objeto()!.fotos.length > 1) {
              <div class="miniaturas">
                @for (foto of objeto()!.fotos; track foto.id) {
                  <img
                    [src]="foto.thumbnailUrl || foto.url"
                    [alt]="objeto()!.titulo"
                    [class.activa]="imagenActual() === foto.url"
                    (click)="seleccionarImagen(foto.url)"
                  >
                }
              </div>
            }
          </div>

          <div class="info">
            <span class="codigo">{{ objeto()!.codigoUnico }}</span>
            <h1>{{ objeto()!.titulo }}</h1>

            @if (objeto()!.categoria) {
              <span class="categoria">{{ objeto()!.categoria!.nombre }}</span>
            }

            <div class="detalles">
              @if (objeto()!.descripcion) {
                <div class="detalle-item">
                  <strong>Descripcion:</strong>
                  <p>{{ objeto()!.descripcion }}</p>
                </div>
              }

              @if (objeto()!.marca) {
                <div class="detalle-item">
                  <strong>Marca:</strong> {{ objeto()!.marca }}
                </div>
              }

              @if (objeto()!.modelo) {
                <div class="detalle-item">
                  <strong>Modelo:</strong> {{ objeto()!.modelo }}
                </div>
              }

              @if (objeto()!.color) {
                <div class="detalle-item">
                  <strong>Color:</strong> {{ objeto()!.color }}
                </div>
              }

              @if (objeto()!.fechaHallazgo) {
                <div class="detalle-item">
                  <strong>Fecha de hallazgo:</strong> {{ objeto()!.fechaHallazgo | date:'dd/MM/yyyy' }}
                </div>
              }

              @if (objeto()!.direccionHallazgo) {
                <div class="detalle-item">
                  <strong>Lugar de hallazgo:</strong> {{ objeto()!.direccionHallazgo }}
                </div>
              }

              @if (objeto()!.ayuntamiento) {
                <div class="detalle-item">
                  <strong>Ayuntamiento:</strong> {{ objeto()!.ayuntamiento!.nombre }}
                </div>
              }
            </div>

            <div class="acciones">
              @if (authService.isAuthenticated()) {
                <button class="btn btn-primary" (click)="solicitarRecuperacion()">
                  Solicitar recuperacion
                </button>
              } @else {
                <a routerLink="/login" class="btn btn-primary">
                  Inicia sesion para reclamar
                </a>
              }
              <a routerLink="/galeria" class="btn btn-outline">
                Volver a la galeria
              </a>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .detalle-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .loading, .error {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .error {
      color: #c00;
    }

    .detalle-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
    }

    .galeria {
      position: sticky;
      top: 2rem;
    }

    .imagen-principal {
      width: 100%;
      aspect-ratio: 1;
      background: #f0f0f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .imagen-principal img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .no-imagen {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }

    .miniaturas {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      overflow-x: auto;
    }

    .miniaturas img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .miniaturas img:hover,
    .miniaturas img.activa {
      opacity: 1;
    }

    .info {
      padding: 1rem 0;
    }

    .codigo {
      display: inline-block;
      background: #f0f0f0;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    h1 {
      margin: 0.5rem 0 1rem;
      font-size: 2rem;
    }

    .categoria {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .detalles {
      margin-top: 2rem;
    }

    .detalle-item {
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;
    }

    .detalle-item strong {
      display: block;
      color: #666;
      margin-bottom: 0.25rem;
    }

    .detalle-item p {
      margin: 0;
    }

    .acciones {
      margin-top: 2rem;
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      border: none;
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
      .detalle-content {
        grid-template-columns: 1fr;
      }

      .galeria {
        position: static;
      }
    }
  `]
})
export class ObjetoDetalleComponent implements OnInit {
  private objetoService = inject(ObjetoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);

  objeto = signal<Objeto | null>(null);
  loading = signal(true);
  error = signal('');
  imagenActual = signal('');

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadObjeto(+id);
  }

  private loadObjeto(id: number) {
    this.objetoService.getObjeto(id).subscribe({
      next: (objeto) => {
        this.objeto.set(objeto);
        if (objeto.fotos && objeto.fotos.length > 0) {
          this.imagenActual.set(objeto.fotos[0].url);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Error al cargar el objeto');
      }
    });
  }

  seleccionarImagen(url: string) {
    this.imagenActual.set(url);
  }

  solicitarRecuperacion() {
    const obj = this.objeto();
    if (obj) {
      this.router.navigate(['/mis-objetos'], {
        queryParams: { solicitar: obj.id }
      });
    }
  }
}
