import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  data?: any;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificacionesSignal = signal<Notificacion[]>([]);
  private noLeidasSignal = signal<number>(0);

  notificaciones = this.notificacionesSignal.asReadonly();
  noLeidas = this.noLeidasSignal.asReadonly();

  constructor(private api: ApiService) {}

  loadNotificaciones(): Observable<{ data: Notificacion[]; noLeidas: number }> {
    return this.api.get<{ data: Notificacion[]; noLeidas: number }>('/notificaciones').pipe(
      tap(response => {
        this.notificacionesSignal.set(response.data);
        this.noLeidasSignal.set(response.noLeidas);
      })
    );
  }

  marcarComoLeida(id: number): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(`/notificaciones/${id}/leer`, {}).pipe(
      tap(() => {
        this.notificacionesSignal.update(notifs =>
          notifs.map(n => (n.id === id ? { ...n, leida: true } : n))
        );
        this.noLeidasSignal.update(count => Math.max(0, count - 1));
      })
    );
  }

  marcarTodasComoLeidas(): Observable<{ message: string }> {
    return this.api.put<{ message: string }>('/notificaciones/leer-todas', {}).pipe(
      tap(() => {
        this.notificacionesSignal.update(notifs => notifs.map(n => ({ ...n, leida: true })));
        this.noLeidasSignal.set(0);
      })
    );
  }
}
