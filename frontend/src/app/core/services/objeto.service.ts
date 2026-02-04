import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Objeto, Categoria, ObjetosFilter, PaginatedResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ObjetoService {
  constructor(private api: ApiService) {}

  getObjetos(filters?: ObjetosFilter): Observable<PaginatedResponse<Objeto>> {
    return this.api.get<PaginatedResponse<Objeto>>('/objetos', filters);
  }

  getObjeto(id: number): Observable<Objeto> {
    return this.api.get<Objeto>(`/objetos/${id}`);
  }

  reportarPerdido(data: FormData | Partial<Objeto>): Observable<{ message: string; id: number; codigo: string }> {
    return this.api.post('/objetos/perdidos', data);
  }

  solicitarRecuperacion(
    objetoId: number,
    data: FormData | { descripcion?: string; tipoEntrega?: string; direccionEnvio?: string }
  ): Observable<{ message: string; id: number }> {
    return this.api.post(`/objetos/${objetoId}/solicitar`, data);
  }

  getCategorias(): Observable<Categoria[]> {
    return this.api.get<Categoria[] | { data: Categoria[] }>('/categorias').pipe(
      map(response => Array.isArray(response) ? response : response.data || [])
    );
  }

  getCategoriasArbol(): Observable<Categoria[]> {
    return this.api.get<Categoria[] | { data: Categoria[] }>('/categorias/arbol').pipe(
      map(response => Array.isArray(response) ? response : response.data || [])
    );
  }

  getMisObjetos(): Observable<{
    perdidos: Objeto[];
    solicitudes: any[];
  }> {
    return this.api.get('/mis-objetos');
  }

  getObjetosRecientes(limit: number = 6): Observable<Objeto[]> {
    return this.api.get<PaginatedResponse<Objeto>>(`/objetos?limit=${limit}`).pipe(
      map(response => response.data || [])
    );
  }
}
