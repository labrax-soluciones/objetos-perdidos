export interface Objeto {
  id: number;
  codigoUnico: string;
  tipo: ObjetoTipo;
  estado: ObjetoEstado;
  titulo: string;
  descripcion?: string;
  categoria?: Categoria;
  marca?: string;
  modelo?: string;
  color?: string;
  numeroSerie?: string;
  fechaHallazgo?: string;
  horaHallazgo?: string;
  direccionHallazgo?: string;
  latitud?: number;
  longitud?: number;
  ayuntamiento?: {
    id: number;
    nombre: string;
  };
  ubicacionAlmacen?: {
    id: number;
    codigo: string;
  };
  qrCode?: string;
  valorEstimado?: string;
  fotos: ObjetoFoto[];
  fotoPrincipal?: ObjetoFoto;
  coincidencias?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ObjetoFoto {
  id: number;
  url: string;
  thumbnailUrl?: string;
  esPrincipal: boolean;
  orden: number;
  textoOcr?: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  icono?: string;
  descripcion?: string;
  padreId?: number;
  orden: number;
  hijos?: Categoria[];
}

export type ObjetoTipo = 'ENCONTRADO' | 'PERDIDO';

export type ObjetoEstado =
  | 'REGISTRADO'
  | 'EN_ALMACEN'
  | 'RECLAMADO'
  | 'ENTREGADO'
  | 'SUBASTA'
  | 'DONADO'
  | 'RECICLADO'
  | 'DESTRUIDO';

export interface ObjetosFilter {
  categoria?: number;
  color?: string;
  q?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  ayuntamiento?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
