import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>Objetos Perdidos</h4>
          <p>Servicio municipal de gestion de objetos perdidos y encontrados.</p>
        </div>

        <div class="footer-section">
          <h4>Enlaces</h4>
          <ul>
            <li><a routerLink="/galeria">Galeria de objetos</a></li>
            <li><a routerLink="/subastas">Subastas</a></li>
            <li><a routerLink="/reportar-perdido">Reportar perdido</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4>Ayuda</h4>
          <ul>
            <li><a href="#">Como funciona</a></li>
            <li><a href="#">Preguntas frecuentes</a></li>
            <li><a href="#">Contacto</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Aviso legal</a></li>
            <li><a href="#">Politica de privacidad</a></li>
            <li><a href="#">Politica de cookies</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} Ayuntamiento. Todos los derechos reservados.</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #2d3748;
      color: #a0aec0;
      margin-top: auto;
    }

    .footer-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 3rem 2rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
    }

    .footer-section h4 {
      color: white;
      margin: 0 0 1rem;
      font-size: 1rem;
    }

    .footer-section p {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.6;
    }

    .footer-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-section li {
      margin-bottom: 0.5rem;
    }

    .footer-section a {
      color: #a0aec0;
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s;
    }

    .footer-section a:hover {
      color: white;
    }

    .footer-bottom {
      border-top: 1px solid #4a5568;
      padding: 1.5rem 2rem;
      text-align: center;
    }

    .footer-bottom p {
      margin: 0;
      font-size: 0.875rem;
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
