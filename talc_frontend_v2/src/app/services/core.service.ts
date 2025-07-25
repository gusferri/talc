/**
 * Servicio Core - Gestión centralizada de configuraciones y notificaciones
 *
 * Este servicio proporciona funcionalidades centralizadas para el sistema TALC,
 * incluyendo la gestión de configuraciones de la aplicación y un sistema
 * de notificaciones reactivo.
 *
 * Funcionalidades principales:
 * - Gestión de configuraciones de la aplicación
 * - Sistema de notificaciones reactivo
 * - Manejo de señales (signals) de Angular
 * - Observables para cambios de configuración
 * - Valores por defecto de la aplicación
 *
 * Arquitectura:
 * - Servicio inyectable con signals de Angular
 * - BehaviorSubject para notificaciones reactivas
 * - Configuraciones tipadas con AppSettings
 * - Patrón observer para cambios de estado
 */

// Importaciones de Angular y RxJS
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Configuraciones de la aplicación
import { AppSettings, defaults } from '../config';

/**
 * Servicio central para gestión de configuraciones y notificaciones
 */
@Injectable({
  providedIn: 'root',
})
export class CoreService {
  /** Señal reactiva para las opciones de configuración de la aplicación */
  private optionsSignal = signal<AppSettings>(defaults);
  
  /** Subject para notificaciones de cambios en la configuración */
  private notify$ = new BehaviorSubject<Record<string, any>>({});

  /**
   * Constructor: inicializa el servicio con las configuraciones por defecto
   */
  constructor() {
    this.notify$.next(this.optionsSignal());
  }

  /**
   * Observable para recibir notificaciones de actualizaciones
   * Permite a otros componentes suscribirse a cambios de configuración
   * 
   * @returns Observable con las notificaciones de cambios
   */
  get notify(): Observable<Record<string, any>> {
    return this.notify$.asObservable();
  }

  /**
   * Obtiene las opciones actuales de configuración
   * Retorna el estado actual de la configuración de la aplicación
   * 
   * @returns Configuración actual de la aplicación
   */
  getOptions(): AppSettings {
    return this.optionsSignal();
  }

  /**
   * Establece nuevas opciones de configuración
   * Actualiza parcialmente la configuración y notifica a los suscriptores
   * 
   * @param options - Opciones parciales a actualizar
   */
  setOptions(options: Partial<AppSettings>) {
    // Actualiza la señal con las nuevas opciones
    this.optionsSignal.update((current) => ({
      ...current,
      ...options,
    }));
    
    // Notifica a los suscriptores sobre el cambio
    this.notify$.next(this.optionsSignal);
  }
}
