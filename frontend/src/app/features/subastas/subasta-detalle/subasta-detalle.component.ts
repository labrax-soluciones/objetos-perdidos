import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface Subasta {
  id: number;
  lote: {
    id: number;
    codigo: string;
    nombre: string;
    objetos: any[];
  };
  precioSalida: number;
  precioActual: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  ganador?: {
    id: number;
    nombre: string;
  };
  pujas: Puja[];
}

interface Puja {
  id: number;
  cantidad: number;
  createdAt: string;
  usuario: {
    id: number;
    nombre: string;
  };
}

@Component({
  selector: 'app-subasta-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="subasta-container">
      @if (loading()) {
        <div class="loading">Cargando subasta...</div>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else if (subasta()) {
        <div class="subasta-content">
          <div class="galeria-section">
            <div class="imagen-principal">
              @if (imagenActual()) {
                <img [src]="imagenActual()" alt="Lote">
              } @else {
                <div class="no-imagen">Sin imagenes</div>
              }
            </div>
            @if (todasImagenes().length > 1) {
              <div class="miniaturas">
                @for (img of todasImagenes(); track img) {
                  <img
                    [src]="img"
                    [class.activa]="imagenActual() === img"
                    (click)="seleccionarImagen(img)"
                    alt="Miniatura"
                  >
                }
              </div>
            }

            <div class="objetos-lote">
              <h3>Objetos incluidos ({{ subasta()!.lote.objetos.length }})</h3>
              <div class="objetos-lista">
                @for (objeto of subasta()!.lote.objetos; track objeto.id) {
                  <div class="objeto-item">
                    <div class="objeto-thumb">
                      @if (objeto.fotos?.length > 0) {
                        <img [src]="objeto.fotos[0].thumbnailUrl" [alt]="objeto.titulo">
                      }
                    </div>
                    <div class="objeto-info">
                      <strong>{{ objeto.titulo }}</strong>
                      <span class="categoria">{{ objeto.categoria?.nombre }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="info-section">
            <span class="codigo">Lote {{ subasta()!.lote.codigo }}</span>
            <h1>{{ subasta()!.lote.nombre }}</h1>

            <div class="estado-tiempo">
              <span class="estado" [class]="'estado-' + subasta()!.estado.toLowerCase()">
                {{ getEstadoLabel(subasta()!.estado) }}
              </span>
              @if (subasta()!.estado === 'ACTIVA') {
                <span class="tiempo-restante">
                  Termina en: {{ tiempoRestante() }}
                </span>
              }
            </div>

            <div class="precios-box">
              <div class="precio-actual">
                <span class="label">Puja actual</span>
                <span class="valor">{{ subasta()!.precioActual | currency:'EUR' }}</span>
              </div>
              <div class="precio-salida">
                Precio salida: {{ subasta()!.precioSalida | currency:'EUR' }}
              </div>
            </div>

            @if (subasta()!.estado === 'ACTIVA') {
              @if (authService.isAuthenticated()) {
                <div class="pujar-form">
                  <label>Tu puja (minimo {{ pujaMinima() | currency:'EUR' }})</label>
                  <div class="input-group">
                    <input
                      type="number"
                      [(ngModel)]="cantidadPuja"
                      [min]="pujaMinima()"
                      step="1"
                    >
                    <button
                      class="btn btn-primary"
                      (click)="pujar()"
                      [disabled]="enviandoPuja() || cantidadPuja < pujaMinima()"
                    >
                      {{ enviandoPuja() ? 'Enviando...' : 'Pujar' }}
                    </button>
                  </div>
                  @if (errorPuja()) {
                    <p class="error-puja">{{ errorPuja() }}</p>
                  }
                  @if (exitoPuja()) {
                    <p class="exito-puja">{{ exitoPuja() }}</p>
                  }
                </div>
              } @else {
                <a routerLink="/login" class="btn btn-primary btn-block">
                  Inicia sesion para pujar
                </a>
              }
            } @else if (subasta()!.estado === 'ADJUDICADA' && subasta()!.ganador) {
              <div class="ganador-box">
                <span class="label">Ganador</span>
                <span class="ganador-nombre">{{ subasta()!.ganador!.nombre }}</span>
                <span class="ganador-precio">{{ subasta()!.precioActual | currency:'EUR' }}</span>
              </div>
            }

            <div class="historial-pujas">
              <h3>Historial de pujas ({{ subasta()!.pujas?.length || 0 }})</h3>
              @if (!subasta()!.pujas || subasta()!.pujas.length === 0) {
                <p class="no-pujas">Aun no hay pujas</p>
              } @else {
                <div class="pujas-lista">
                  @for (puja of subasta()!.pujas; track puja.id; let i = $index) {
                    <div class="puja-item" [class.ganadora]="i === 0 && subasta()!.estado !== 'ACTIVA'">
                      <div class="puja-info">
                        <span class="puja-usuario">{{ puja.usuario.nombre }}</span>
                        <span class="puja-fecha">{{ puja.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                      <span class="puja-cantidad">{{ puja.cantidad | currency:'EUR' }}</span>
                    </div>
                  }
                </div>
              }
            </div>

            <a routerLink="/subastas" class="btn btn-outline btn-block">
              Volver a subastas
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .subasta-container {
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

    .subasta-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
    }

    .galeria-section {
      position: sticky;
      top: 2rem;
    }

    .imagen-principal {
      width: 100%;
      aspect-ratio: 1;
      background: #f0f0f0;
      border-radius: 12px;
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

    .objetos-lote {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #eee;
    }

    .objetos-lote h3 {
      margin: 0 0 1rem;
      font-size: 1rem;
    }

    .objetos-lista {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .objeto-item {
      display: flex;
      gap: 1rem;
      padding: 0.75rem;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .objeto-thumb {
      width: 50px;
      height: 50px;
      border-radius: 4px;
      overflow: hidden;
      background: #eee;
    }

    .objeto-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .objeto-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .objeto-info strong {
      font-size: 0.875rem;
    }

    .categoria {
      font-size: 0.75rem;
      color: #999;
    }

    .info-section {
      padding: 1rem 0;
    }

    .codigo {
      font-size: 0.875rem;
      color: #999;
      text-transform: uppercase;
    }

    h1 {
      margin: 0.5rem 0 1.5rem;
      font-size: 2rem;
    }

    .estado-tiempo {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .estado {
      padding: 6px 16px;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .estado-activa {
      background: #4caf50;
      color: white;
    }

    .estado-programada {
      background: #ff9800;
      color: white;
    }

    .estado-cerrada, .estado-adjudicada {
      background: #9e9e9e;
      color: white;
    }

    .tiempo-restante {
      color: #e53935;
      font-weight: 500;
    }

    .precios-box {
      background: #f9f9f9;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }

    .precio-actual {
      text-align: center;
      margin-bottom: 0.5rem;
    }

    .precio-actual .label {
      display: block;
      font-size: 0.875rem;
      color: #666;
    }

    .precio-actual .valor {
      font-size: 2.5rem;
      font-weight: 700;
      color: #667eea;
    }

    .precio-salida {
      text-align: center;
      font-size: 0.875rem;
      color: #999;
    }

    .pujar-form {
      background: #f0f4ff;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }

    .pujar-form label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .input-group {
      display: flex;
      gap: 0.5rem;
    }

    .input-group input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1.25rem;
    }

    .error-puja {
      color: #c00;
      margin: 0.5rem 0 0;
      font-size: 0.875rem;
    }

    .exito-puja {
      color: #2e7d32;
      margin: 0.5rem 0 0;
      font-size: 0.875rem;
    }

    .ganador-box {
      background: #e8f5e9;
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .ganador-box .label {
      display: block;
      font-size: 0.875rem;
      color: #666;
    }

    .ganador-nombre {
      display: block;
      font-size: 1.5rem;
      font-weight: 600;
      color: #2e7d32;
    }

    .ganador-precio {
      display: block;
      font-size: 1rem;
      color: #666;
    }

    .historial-pujas {
      margin: 2rem 0;
    }

    .historial-pujas h3 {
      margin: 0 0 1rem;
    }

    .no-pujas {
      color: #999;
      text-align: center;
      padding: 2rem;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .pujas-lista {
      max-height: 300px;
      overflow-y: auto;
    }

    .puja-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border-bottom: 1px solid #eee;
    }

    .puja-item.ganadora {
      background: #e8f5e9;
      border-radius: 4px;
    }

    .puja-info {
      display: flex;
      flex-direction: column;
    }

    .puja-usuario {
      font-weight: 500;
    }

    .puja-fecha {
      font-size: 0.75rem;
      color: #999;
    }

    .puja-cantidad {
      font-weight: 600;
      color: #667eea;
    }

    .btn {
      padding: 0.875rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
    }

    .btn-block {
      display: block;
      width: 100%;
      text-align: center;
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

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    @media (max-width: 900px) {
      .subasta-content {
        grid-template-columns: 1fr;
      }

      .galeria-section {
        position: static;
      }
    }
  `]
})
export class SubastaDetalleComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  authService = inject(AuthService);

  subasta = signal<Subasta | null>(null);
  loading = signal(true);
  error = signal('');

  imagenActual = signal('');
  todasImagenes = signal<string[]>([]);

  cantidadPuja = 0;
  enviandoPuja = signal(false);
  errorPuja = signal('');
  exitoPuja = signal('');

  tiempoRestante = signal('');
  private timerInterval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadSubasta(+id);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private loadSubasta(id: number) {
    this.loading.set(true);
    this.api.get<Subasta>(`/subastas/${id}`).subscribe({
      next: (subasta) => {
        this.subasta.set(subasta);
        this.prepararImagenes(subasta);
        this.cantidadPuja = this.pujaMinima();
        this.iniciarContador(subasta);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Error al cargar la subasta');
      }
    });
  }

  private prepararImagenes(subasta: Subasta) {
    const imagenes: string[] = [];
    subasta.lote.objetos.forEach(obj => {
      if (obj.fotos) {
        obj.fotos.forEach((foto: any) => {
          imagenes.push(foto.url);
        });
      }
    });
    this.todasImagenes.set(imagenes);
    if (imagenes.length > 0) {
      this.imagenActual.set(imagenes[0]);
    }
  }

  private iniciarContador(subasta: Subasta) {
    if (subasta.estado !== 'ACTIVA') return;

    const actualizarTiempo = () => {
      const ahora = new Date().getTime();
      const fin = new Date(subasta.fechaFin).getTime();
      const diferencia = fin - ahora;

      if (diferencia <= 0) {
        this.tiempoRestante.set('Finalizada');
        if (this.timerInterval) clearInterval(this.timerInterval);
        return;
      }

      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

      if (dias > 0) {
        this.tiempoRestante.set(`${dias}d ${horas}h ${minutos}m`);
      } else if (horas > 0) {
        this.tiempoRestante.set(`${horas}h ${minutos}m ${segundos}s`);
      } else {
        this.tiempoRestante.set(`${minutos}m ${segundos}s`);
      }
    };

    actualizarTiempo();
    this.timerInterval = setInterval(actualizarTiempo, 1000);
  }

  seleccionarImagen(url: string) {
    this.imagenActual.set(url);
  }

  pujaMinima(): number {
    const sub = this.subasta();
    if (!sub) return 0;
    return sub.precioActual + 1;
  }

  pujar() {
    const sub = this.subasta();
    if (!sub || this.cantidadPuja < this.pujaMinima()) return;

    this.enviandoPuja.set(true);
    this.errorPuja.set('');
    this.exitoPuja.set('');

    this.api.post(`/subastas/${sub.id}/pujar`, { cantidad: this.cantidadPuja }).subscribe({
      next: () => {
        this.enviandoPuja.set(false);
        this.exitoPuja.set('Puja realizada correctamente');
        this.loadSubasta(sub.id);
      },
      error: (err) => {
        this.enviandoPuja.set(false);
        this.errorPuja.set(err.message || 'Error al realizar la puja');
      }
    });
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      'PROGRAMADA': 'Proxima',
      'ACTIVA': 'En curso',
      'CERRADA': 'Finalizada',
      'ADJUDICADA': 'Adjudicada'
    };
    return labels[estado] || estado;
  }
}
