import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="header-content">
        <a routerLink="/" class="logo">
          <span class="logo-icon">🔍</span>
          <span class="logo-text">Objetos Perdidos</span>
        </a>

        <nav class="nav-menu" [class.open]="menuOpen">
          <a routerLink="/galeria" routerLinkActive="active">Galeria</a>
          <a routerLink="/subastas" routerLinkActive="active">Subastas</a>

          @if (authService.isAuthenticated()) {
            <a routerLink="/reportar-perdido" routerLinkActive="active">Reportar perdido</a>
            <a routerLink="/mis-objetos" routerLinkActive="active">Mis objetos</a>

            @if (authService.isAdmin()) {
              <a routerLink="/admin" routerLinkActive="active" class="admin-link">Admin</a>
            }

            <div class="user-menu">
              <button class="user-button" (click)="toggleUserMenu()">
                <span class="user-avatar">{{ getUserInitials() }}</span>
                <span class="user-name">{{ authService.currentUser()?.nombre }}</span>
              </button>
              @if (userMenuOpen) {
                <div class="user-dropdown">
                  <a routerLink="/perfil" (click)="closeMenus()">Mi perfil</a>
                  <button (click)="logout()">Cerrar sesion</button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/login" class="btn-login">Iniciar sesion</a>
            <a routerLink="/registro" class="btn-registro">Registrarse</a>
          }
        </nav>

        <button class="menu-toggle" (click)="toggleMenu()">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: #333;
      font-weight: 600;
      font-size: 1.25rem;
    }

    .logo-icon {
      font-size: 1.5rem;
    }

    .nav-menu {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .nav-menu a {
      color: #666;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }

    .nav-menu a:hover,
    .nav-menu a.active {
      color: #667eea;
    }

    .admin-link {
      color: #9c27b0 !important;
    }

    .btn-login {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: 1px solid #667eea;
      color: #667eea !important;
    }

    .btn-registro {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      background: #667eea;
      color: white !important;
    }

    .user-menu {
      position: relative;
    }

    .user-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem;
      border: none;
      background: none;
      cursor: pointer;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .user-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.5rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      min-width: 180px;
      overflow: hidden;
    }

    .user-dropdown a,
    .user-dropdown button {
      display: block;
      width: 100%;
      padding: 0.75rem 1rem;
      text-align: left;
      border: none;
      background: none;
      color: #333;
      text-decoration: none;
      cursor: pointer;
    }

    .user-dropdown a:hover,
    .user-dropdown button:hover {
      background: #f5f5f5;
    }

    .menu-toggle {
      display: none;
      flex-direction: column;
      gap: 5px;
      padding: 0.5rem;
      border: none;
      background: none;
      cursor: pointer;
    }

    .menu-toggle span {
      width: 24px;
      height: 2px;
      background: #333;
    }

    @media (max-width: 900px) {
      .menu-toggle {
        display: flex;
      }

      .nav-menu {
        position: fixed;
        top: 70px;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        flex-direction: column;
        padding: 2rem;
        gap: 1rem;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      }

      .nav-menu.open {
        transform: translateX(0);
      }

      .user-dropdown {
        position: static;
        box-shadow: none;
        border-top: 1px solid #eee;
        margin-top: 1rem;
      }
    }
  `]
})
export class HeaderComponent {
  authService = inject(AuthService);

  menuOpen = false;
  userMenuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) this.userMenuOpen = false;
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeMenus() {
    this.menuOpen = false;
    this.userMenuOpen = false;
  }

  getUserInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    const nombre = user.nombre || '';
    const apellidos = user.apellidos || '';
    return (nombre.charAt(0) + apellidos.charAt(0)).toUpperCase();
  }

  logout() {
    this.authService.logout();
    this.closeMenus();
  }
}
