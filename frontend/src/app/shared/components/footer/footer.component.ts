import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="bg-gray-800 text-gray-400 mt-auto">
      <div class="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <h4 class="text-white mb-4 text-base font-semibold">Objetos Perdidos</h4>
          <p class="text-sm leading-relaxed">Servicio municipal de gestion de objetos perdidos y encontrados.</p>
        </div>

        <div>
          <h4 class="text-white mb-4 text-base font-semibold">Enlaces</h4>
          <ul class="space-y-2">
            <li><a routerLink="/galeria" class="text-sm hover:text-white transition-colors duration-200">Galeria de objetos</a></li>
            <li><a routerLink="/subastas" class="text-sm hover:text-white transition-colors duration-200">Subastas</a></li>
            <li><a routerLink="/reportar-perdido" class="text-sm hover:text-white transition-colors duration-200">Reportar perdido</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-white mb-4 text-base font-semibold">Ayuda</h4>
          <ul class="space-y-2">
            <li><a href="#" class="text-sm hover:text-white transition-colors duration-200">Como funciona</a></li>
            <li><a href="#" class="text-sm hover:text-white transition-colors duration-200">Preguntas frecuentes</a></li>
            <li><a href="#" class="text-sm hover:text-white transition-colors duration-200">Contacto</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-white mb-4 text-base font-semibold">Legal</h4>
          <ul class="space-y-2">
            <li><a href="#" class="text-sm hover:text-white transition-colors duration-200">Aviso legal</a></li>
            <li><a href="#" class="text-sm hover:text-white transition-colors duration-200">Politica de privacidad</a></li>
            <li><a href="#" class="text-sm hover:text-white transition-colors duration-200">Politica de cookies</a></li>
          </ul>
        </div>
      </div>

      <div class="border-t border-gray-700 px-8 py-6 text-center">
        <p class="text-sm">&copy; {{ currentYear }} Ayuntamiento. Todos los derechos reservados.</p>
      </div>
    </footer>
  `,
  styles: []
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
