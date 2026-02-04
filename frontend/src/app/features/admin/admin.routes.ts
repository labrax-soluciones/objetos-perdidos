import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'objetos',
    loadComponent: () => import('./objetos/objetos-admin.component').then(m => m.ObjetosAdminComponent)
  },
  {
    path: 'objetos/nuevo',
    loadComponent: () => import('./objetos/objeto-form.component').then(m => m.ObjetoFormComponent)
  },
  {
    path: 'objetos/:id',
    loadComponent: () => import('./objetos/objeto-form.component').then(m => m.ObjetoFormComponent)
  },
  {
    path: 'solicitudes',
    loadComponent: () => import('./solicitudes/solicitudes-admin.component').then(m => m.SolicitudesAdminComponent)
  },
  {
    path: 'coincidencias',
    loadComponent: () => import('./coincidencias/coincidencias-admin.component').then(m => m.CoincidenciasAdminComponent)
  },
  {
    path: 'almacen',
    loadComponent: () => import('./almacen/almacen-admin.component').then(m => m.AlmacenAdminComponent)
  },
  {
    path: 'lotes',
    loadComponent: () => import('./lotes/lotes-admin.component').then(m => m.LotesAdminComponent)
  },
  {
    path: 'subastas',
    loadComponent: () => import('./subastas/subastas-admin.component').then(m => m.SubastasAdminComponent)
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./usuarios/usuarios-admin.component').then(m => m.UsuariosAdminComponent)
  },
  {
    path: 'estadisticas',
    loadComponent: () => import('./estadisticas/estadisticas-admin.component').then(m => m.EstadisticasAdminComponent)
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./configuracion/configuracion-admin.component').then(m => m.ConfiguracionAdminComponent)
  }
];
