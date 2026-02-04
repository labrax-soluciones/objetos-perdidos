import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'galeria',
    loadComponent: () => import('./features/galeria/galeria.component').then(m => m.GaleriaComponent)
  },
  {
    path: 'objeto/:id',
    loadComponent: () => import('./features/objeto-detalle/objeto-detalle.component').then(m => m.ObjetoDetalleComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/auth/registro/registro.component').then(m => m.RegistroComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'recuperar-password',
    loadComponent: () => import('./features/auth/recuperar-password/recuperar-password.component').then(m => m.RecuperarPasswordComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'reset-password/:token',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'verificar-email/:token',
    loadComponent: () => import('./features/auth/verificar-email/verificar-email.component').then(m => m.VerificarEmailComponent)
  },
  {
    path: 'reportar-perdido',
    loadComponent: () => import('./features/reportar-perdido/reportar-perdido.component').then(m => m.ReportarPerdidoComponent),
    canActivate: [authGuard]
  },
  {
    path: 'mis-objetos',
    loadComponent: () => import('./features/mis-objetos/mis-objetos.component').then(m => m.MisObjetosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'subastas',
    loadComponent: () => import('./features/subastas/subastas-list/subastas-list.component').then(m => m.SubastasListComponent)
  },
  {
    path: 'subastas/:id',
    loadComponent: () => import('./features/subastas/subasta-detalle/subasta-detalle.component').then(m => m.SubastaDetalleComponent)
  },
  {
    path: 'perfil',
    loadComponent: () => import('./features/perfil/perfil.component').then(m => m.PerfilComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
