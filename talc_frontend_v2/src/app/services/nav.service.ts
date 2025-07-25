/**
 * Servicio de Navegación - Gestión del estado de navegación
 *
 * Este servicio maneja el seguimiento del estado de navegación
 * en el sistema TALC, proporcionando información sobre la URL
 * actual y eventos de navegación.
 *
 * Funcionalidades principales:
 * - Seguimiento de la URL actual de la aplicación
 * - Detección de eventos de navegación
 * - Señal reactiva para la URL actual
 * - Integración con Angular Router
 *
 * Arquitectura:
 * - Servicio inyectable con signals de Angular
 * - Suscripción a eventos del Router
 * - Manejo de NavigationEnd events
 * - Estado reactivo para la URL actual
 */

// Importaciones de Angular
import { Injectable, signal } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';

/**
 * Servicio para gestionar el estado de navegación de la aplicación
 */
@Injectable({ providedIn: 'root' })
export class NavService {
  /** Variable para controlar la visibilidad de elementos de navegación */
  showClass: any = false;

  /** Señal reactiva que contiene la URL actual de la aplicación */
  public currentUrl = signal<string | undefined>(undefined);

  /**
   * Constructor: inicializa el servicio y suscribe a eventos de navegación
   */
  constructor(private router: Router) {
    // Se suscribe a los eventos del router para detectar cambios de navegación
    this.router.events.subscribe((event: Event) => {
      // Solo actualiza la URL cuando la navegación ha terminado
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects);
      }
    });
  }
}
