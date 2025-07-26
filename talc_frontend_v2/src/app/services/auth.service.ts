/**
 * Servicio de Autenticación - Gestión centralizada de roles y permisos
 *
 * Este servicio maneja la verificación de roles de usuario y proporciona
 * métodos centralizados para determinar permisos y accesos en el sistema TALC.
 *
 * Funcionalidades principales:
 * - Verificación de si un usuario es profesional
 * - Cache de información de roles para optimizar rendimiento
 * - Obtención del ID del profesional asociado al usuario
 * - Gestión centralizada de permisos
 * - Eliminación de comparaciones de strings inconsistentes
 *
 * Arquitectura:
 * - Servicio inyectable con cache local
 * - Comunicación con backend optimizada
 * - Manejo de errores centralizado
 * - Patrón singleton para información de usuario
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** URL base para operaciones de autenticación */
  private apiUrl = `${environment.apiBaseUrl}/pacientes`;
  
  /** Cache local para evitar múltiples llamadas al backend */
  private profesionalCache: { [key: string]: boolean } = {};
  private idProfesionalCache: { [key: string]: number | null } = {};
  
  /** Subject reactivo para cambios en el estado de profesional */
  private esProfesionalSubject = new BehaviorSubject<boolean>(false);
  
  /** Observable público para cambios en el estado de profesional */
  public esProfesional$ = this.esProfesionalSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Verifica si el usuario logueado es un profesional
   * Utiliza cache para optimizar rendimiento
   * 
   * @param username - Nombre de usuario a verificar
   * @returns Observable con boolean indicando si es profesional
   */
  verificarProfesional(username: string): Observable<boolean> {
    // Verificar cache primero
    if (this.profesionalCache[username] !== undefined) {
      this.esProfesionalSubject.next(this.profesionalCache[username]);
      return of(this.profesionalCache[username]);
    }

    // Si no está en cache, consultar backend
    return this.http.get(`${this.apiUrl}/esProfesionalPorShortname?shortname=${username}`).pipe(
      map((res: any) => res?.esProfesional === true),
      tap(esProf => {
        this.profesionalCache[username] = esProf;
        this.esProfesionalSubject.next(esProf);
        // Guardar en localStorage para persistencia
        localStorage.setItem('esProfesional', JSON.stringify(esProf));
      }),
      catchError(error => {
        console.error('Error al verificar profesional:', error);
        this.profesionalCache[username] = false;
        this.esProfesionalSubject.next(false);
        localStorage.setItem('esProfesional', JSON.stringify(false));
        return of(false);
      })
    );
  }

  /**
   * Obtiene el ID del profesional asociado al usuario
   * Utiliza cache para optimizar rendimiento
   * 
   * @param username - Nombre de usuario del profesional
   * @returns Observable con el ID del profesional o null si no es profesional
   */
  obtenerIdProfesional(username: string): Observable<number | null> {
    // Verificar cache primero
    if (this.idProfesionalCache[username] !== undefined) {
      return of(this.idProfesionalCache[username]);
    }

    // Si no está en cache, consultar backend
    return this.http.get<any>(`${this.apiUrl}/obtenerIdProfesionalPorUsername`, {
      params: { username }
    }).pipe(
      map(res => res?.idProfesional || null),
      tap(idProf => {
        this.idProfesionalCache[username] = idProf;
      }),
      catchError(error => {
        console.error('Error al obtener ID del profesional:', error);
        this.idProfesionalCache[username] = null;
        return of(null);
      })
    );
  }

  /**
   * Obtiene el estado actual de si el usuario es profesional
   * Lee desde localStorage o cache
   * 
   * @returns Boolean indicando si es profesional
   */
  getEsProfesional(): boolean {
    const cached = localStorage.getItem('esProfesional');
    if (cached !== null) {
      return JSON.parse(cached);
    }
    return false;
  }

  /**
   * Limpia el cache de autenticación
   * Útil cuando el usuario cierra sesión o cambia de cuenta
   */
  limpiarCache(): void {
    this.profesionalCache = {};
    this.idProfesionalCache = {};
    this.esProfesionalSubject.next(false);
    localStorage.removeItem('esProfesional');
  }

  /**
   * Verifica si el usuario tiene permisos de profesional
   * Combina verificación de cache y backend
   * 
   * @param username - Nombre de usuario a verificar
   * @returns Observable con boolean indicando permisos
   */
  tienePermisosProfesional(username: string): Observable<boolean> {
    const rol = (localStorage.getItem('rol') || '').toLowerCase();
    
    // Si es secretaria, tiene todos los permisos
    if (this.esSecretaria()) {
      return of(true);
    }
    
    // Si no es secretaria, verificar si es profesional
    return this.verificarProfesional(username);
  }

  /**
   * Verifica si el usuario actual es secretaria
   * Maneja diferentes nombres posibles de roles administrativos
   * 
   * @returns boolean indicando si es secretaria
   */
  esSecretaria(): boolean {
    const rol = (localStorage.getItem('rol') || '').toLowerCase();
    return rol === 'secretaria' || rol === 'secretario' || rol === 'administrativo' || rol === 'admin';
  }

  /**
   * Obtiene el rol actual del usuario
   * 
   * @returns string con el rol del usuario
   */
  obtenerRol(): string {
    return localStorage.getItem('rol') || '';
  }
} 