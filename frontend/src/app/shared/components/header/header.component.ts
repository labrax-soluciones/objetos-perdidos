import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="bg-white shadow-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-8 h-[70px] flex items-center justify-between">
        <a routerLink="/" class="flex items-center gap-2 text-gray-800 font-semibold text-xl">
          <span class="text-2xl">🔍</span>
          <span>Objetos Perdidos</span>
        </a>

        <nav class="flex items-center gap-6 max-[900px]:fixed max-[900px]:top-[70px] max-[900px]:left-0 max-[900px]:right-0 max-[900px]:bottom-0 max-[900px]:bg-white max-[900px]:flex-col max-[900px]:p-8 max-[900px]:gap-4 max-[900px]:translate-x-full max-[900px]:transition-transform max-[900px]:duration-300" [class.max-[900px]:translate-x-0]="menuOpen">
          <a routerLink="/galeria" routerLinkActive="text-primary" class="text-gray-600 font-medium transition-colors duration-200 hover:text-primary">Galeria</a>
          <a routerLink="/subastas" routerLinkActive="text-primary" class="text-gray-600 font-medium transition-colors duration-200 hover:text-primary">Subastas</a>

          @if (authService.isAuthenticated()) {
            <a routerLink="/mis-objetos" routerLinkActive="text-primary" class="text-gray-600 font-medium transition-colors duration-200 hover:text-primary">Mi zona</a>

            @if (authService.isAdmin()) {
              <a routerLink="/admin" routerLinkActive="text-primary" class="text-purple-600 font-medium transition-colors duration-200 hover:text-purple-800">Admin</a>
            }

            <div class="relative">
              <button class="flex items-center gap-2 p-1 border-none bg-transparent cursor-pointer" (click)="toggleUserMenu()">
                <span class="w-9 h-9 rounded-full bg-gradient-primary text-white flex items-center justify-center font-semibold text-sm">{{ getUserInitials() }}</span>
                <span class="font-medium text-gray-800">{{ authService.currentUser()?.nombre }}</span>
              </button>
              @if (userMenuOpen) {
                <div class="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl min-w-[180px] overflow-hidden max-[900px]:static max-[900px]:shadow-none max-[900px]:border-t max-[900px]:border-gray-200 max-[900px]:mt-4">
                  <a routerLink="/perfil" (click)="closeMenus()" class="block w-full px-4 py-3 text-left text-gray-800 hover:bg-gray-100">Mi perfil</a>
                  <button (click)="logout()" class="block w-full px-4 py-3 text-left border-none bg-transparent text-gray-800 cursor-pointer hover:bg-gray-100">Cerrar sesion</button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/login" class="px-4 py-2 rounded-md border border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-200">Iniciar sesion</a>
            <a routerLink="/registro" class="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors duration-200">Registrarse</a>
          }
        </nav>

        <button class="hidden max-[900px]:flex flex-col gap-[5px] p-2 border-none bg-transparent cursor-pointer" (click)="toggleMenu()">
          <span class="w-6 h-0.5 bg-gray-800"></span>
          <span class="w-6 h-0.5 bg-gray-800"></span>
          <span class="w-6 h-0.5 bg-gray-800"></span>
        </button>
      </div>
    </header>
  `,
  styles: []
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
