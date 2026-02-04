import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface Coincidencia {
  id: number;
  objetoEncontrado: {
    id: number;
    codigoUnico: string;
    titulo: string;
    fotos?: { thumbnailUrl: string }[];
  };
  objetoPerdido: {
    id: number;
    titulo: string;
    usuario: { nombre: string; email: string };
    fotos?: { thumbnailUrl: string }[];
  };
  puntuacion: number;
  estado: string;
  createdAt: string;
}

@Component({
  selector: 'app-coincidencias-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="coincidencias-container">
      <div class="header">
        <h1>Coincidencias</h1>
        <p>Revisa las posibles coincidencias entre objetos encontrados y perdidos</p>
      </div>

      <div class="filtros">
        <button
          [class.active]="filtro() === 'PENDIENTE'"
          (click)="filtrar('PENDIENTE')"
        >
          Pendientes
        </button>
        <button
          [class.active]="filtro() === 'CONFIRMADA'"
          (click)="filtrar('CONFIRMADA')"
        >
          Confirmadas
        </button>
        <button
          [class.active]="filtro() === 'DESCARTADA'"
          (click)="filtrar('DESCARTADA')"
        >
          Descartadas
        </button>
      </div>

      @if (loading()) {
        <div class="loading">Cargando coincidencias...</div>
      } @else if (coincidencias().length === 0) {
        <div class="empty-state">
          <p>No hay coincidencias {{ filtro().toLowerCase() }}s</p>
        </div>
      } @else {
        <div class="coincidencias-lista">
          @for (coincidencia of coincidencias(); track coincidencia.id) {
            <div class="coincidencia-card">
              <div class="puntuacion">
                <div class="puntuacion-circulo" [class]="getPuntuacionClass(coincidencia.puntuacion)">
                  {{ coincidencia.puntuacion }}%
                </div>
                <span class="puntuacion-label">Coincidencia</span>
              </div>

              <div class="objetos-comparacion">
                <div class="objeto-col encontrado">
                  <span class="tipo-label">Encontrado</span>
                  <div class="objeto-preview">
                    @if (coincidencia.objetoEncontrado.fotos?.length) {
                      <img [src]="coincidencia.objetoEncontrado.fotos![0].thumbnailUrl" alt="">
                    } @else {
                      <div class="no-img">📦</div>
                    }
                  </div>
                  <p class="objeto-codigo">{{ coincidencia.objetoEncontrado.codigoUnico }}</p>
                  <p class="objeto-titulo">{{ coincidencia.objetoEncontrado.titulo }}</p>
                  <a [routerLink]="['/admin/objetos', coincidencia.objetoEncontrado.id]" class="ver-link">
                    Ver detalle
                  </a>
                </div>

                <div class="vs">VS</div>

                <div class="objeto-col perdido">
                  <span class="tipo-label">Perdido</span>
                  <div class="objeto-preview">
                    @if (coincidencia.objetoPerdido.fotos?.length) {
                      <img [src]="coincidencia.objetoPerdido.fotos![0].thumbnailUrl" alt="">
                    } @else {
                      <div class="no-img">❓</div>
                    }
                  </div>
                  <p class="objeto-titulo">{{ coincidencia.objetoPerdido.titulo }}</p>
                  <p class="objeto-usuario">
                    Reportado por: {{ coincidencia.objetoPerdido.usuario.nombre }}
                  </p>
                  <p class="objeto-email">{{ coincidencia.objetoPerdido.usuario.email }}</p>
                </div>
              </div>

              <div class="coincidencia-footer">
                <span class="fecha">{{ coincidencia.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>

                @if (coincidencia.estado === 'PENDIENTE') {
                  <div class="acciones">
                    <button
                      class="btn btn-success"
                      (click)="confirmar(coincidencia)"
                      [disabled]="procesando()"
                    >
                      Confirmar
                    </button>
                    <button
                      class="btn btn-outline"
                      (click)="descartar(coincidencia)"
                      [disabled]="procesando()"
                    >
                      Descartar
                    </button>
                  </div>
                } @else {
                  <span class="estado-badge" [class]="'estado-' + coincidencia.estado.toLowerCase()">
                    {{ coincidencia.estado }}
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .coincidencias-container {
      padding: 2rem;
    }

    .header {
      margin-bottom: 2rem;
    }

    .header h1 {
      margin: 0 0 0.5rem;
    }

    .header p {
      color: #666;
      margin: 0;
    }

    .filtros {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }

    .filtros button {
      padding: 0.5rem 1.5rem;
      border: 1px solid #ddd;
      background: white;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .filtros button.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .loading, .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;
      background: white;
      border-radius: 8px;
    }

    .coincidencias-lista {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .coincidencia-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      padding: 2rem;
    }

    .puntuacion {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .puntuacion-circulo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
    }

    .puntuacion-circulo.alta { background: #4caf50; }
    .puntuacion-circulo.media { background: #ff9800; }
    .puntuacion-circulo.baja { background: #9e9e9e; }

    .puntuacion-label {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #666;
    }

    .objetos-comparacion {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 2rem;
      align-items: start;
    }

    .objeto-col {
      text-align: center;
    }

    .tipo-label {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .encontrado .tipo-label {
      background: #e8f5e9;
      color: #388e3c;
    }

    .perdido .tipo-label {
      background: #ffebee;
      color: #c62828;
    }

    .objeto-preview {
      width: 150px;
      height: 150px;
      margin: 0 auto 1rem;
      border-radius: 8px;
      overflow: hidden;
      background: #f5f5f5;
    }

    .objeto-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-img {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
    }

    .objeto-codigo {
      font-size: 0.75rem;
      color: #999;
      margin: 0;
    }

    .objeto-titulo {
      font-weight: 600;
      margin: 0.25rem 0;
    }

    .objeto-usuario, .objeto-email {
      font-size: 0.875rem;
      color: #666;
      margin: 0.25rem 0;
    }

    .ver-link {
      color: #667eea;
      text-decoration: none;
      font-size: 0.875rem;
    }

    .vs {
      font-size: 1.5rem;
      font-weight: 700;
      color: #ccc;
      align-self: center;
    }

    .coincidencia-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #eee;
    }

    .fecha {
      font-size: 0.875rem;
      color: #999;
    }

    .acciones {
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 0.5rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-success { background: #4caf50; color: white; }
    .btn-outline { background: white; border: 1px solid #ddd; color: #666; }

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .estado-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .estado-confirmada { background: #e8f5e9; color: #388e3c; }
    .estado-descartada { background: #f5f5f5; color: #616161; }

    @media (max-width: 768px) {
      .objetos-comparacion {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .vs {
        display: none;
      }
    }
  `]
})
export class CoincidenciasAdminComponent implements OnInit {
  private api = inject(ApiService);

  coincidencias = signal<Coincidencia[]>([]);
  loading = signal(true);
  filtro = signal<'PENDIENTE' | 'CONFIRMADA' | 'DESCARTADA'>('PENDIENTE');
  procesando = signal(false);

  ngOnInit() {
    this.cargarCoincidencias();
  }

  filtrar(estado: 'PENDIENTE' | 'CONFIRMADA' | 'DESCARTADA') {
    this.filtro.set(estado);
    this.cargarCoincidencias();
  }

  private cargarCoincidencias() {
    this.loading.set(true);
    this.api.get<Coincidencia[]>(`/admin/coincidencias?estado=${this.filtro()}`).subscribe({
      next: (data) => {
        this.coincidencias.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getPuntuacionClass(puntuacion: number): string {
    if (puntuacion >= 70) return 'alta';
    if (puntuacion >= 40) return 'media';
    return 'baja';
  }

  confirmar(coincidencia: Coincidencia) {
    if (!confirm('¿Confirmar esta coincidencia? Se notificara al ciudadano.')) return;

    this.procesando.set(true);
    this.api.put(`/admin/coincidencias/${coincidencia.id}/confirmar`, {}).subscribe({
      next: () => {
        this.procesando.set(false);
        this.cargarCoincidencias();
      },
      error: () => {
        this.procesando.set(false);
      }
    });
  }

  descartar(coincidencia: Coincidencia) {
    if (!confirm('¿Descartar esta coincidencia?')) return;

    this.procesando.set(true);
    this.api.put(`/admin/coincidencias/${coincidencia.id}/descartar`, {}).subscribe({
      next: () => {
        this.procesando.set(false);
        this.cargarCoincidencias();
      },
      error: () => {
        this.procesando.set(false);
      }
    });
  }
}
