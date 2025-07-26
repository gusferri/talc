/**
 * Guard de Autorización para Administración
 * 
 * Este guard protege las rutas de administración verificando que el usuario
 * tenga permisos de administrador antes de permitir el acceso.
 * 
 * Funcionalidades:
 * - Verifica el rol del usuario desde localStorage
 * - Redirige al dashboard si no tiene permisos
 * - Permite acceso solo a usuarios con rol 'administrador' o 'admin'
 * 
 * Uso:
 * - Se aplica a todas las rutas de administración
 * - Se ejecuta antes de cargar el componente
 * - Proporciona seguridad a nivel de ruta
 */

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Verifica si el usuario puede activar la ruta
   * 
   * @returns boolean indicando si se permite el acceso
   */
  canActivate(): boolean {
    // Verificar si el usuario es administrador
    if (this.authService.esAdministrador()) {
      return true;
    }

    // Si no es administrador, redirigir al dashboard
    console.warn('Acceso denegado: Se requiere rol de administrador');
    this.router.navigate(['/dashboard']);
    return false;
  }
} 