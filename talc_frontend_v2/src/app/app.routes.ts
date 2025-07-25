/**
 * Rutas principales de la aplicación TALC
 *
 * Este archivo define la configuración de rutas principales del sistema TALC,
 * estableciendo la estructura de navegación y los layouts correspondientes
 * para diferentes secciones de la aplicación.
 *
 * Funcionalidades principales:
 * - Redirección automática al dashboard desde la raíz
 * - Layout completo para secciones autenticadas
 * - Layout en blanco para autenticación
 * - Protección de rutas con guard de autenticación
 * - Lazy loading de módulos de páginas
 * - Manejo de rutas no encontradas (404)
 *
 * Arquitectura de rutas:
 * - Ruta raíz: Redirección al dashboard
 * - Rutas autenticadas: Layout completo con guard
 * - Rutas de autenticación: Layout en blanco
 * - Rutas no encontradas: Redirección a página de error
 *
 * Layouts utilizados:
 * - FullComponent: Para secciones principales de la aplicación
 * - BlankComponent: Para páginas de autenticación y error
 */

// Importaciones de Angular Router
import { Routes } from '@angular/router';

// Componentes de layout
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';

// Guards de autenticación
import { authGuard } from './guards/auth.guard';

/**
 * Configuración de rutas principales de la aplicación
 * Define la estructura de navegación y los layouts correspondientes
 */
export const routes: Routes = [
  /**
   * Ruta raíz - Redirección automática al dashboard
   * Cuando el usuario accede a la raíz de la aplicación, se redirige
   * automáticamente al dashboard principal
   */
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  
  /**
   * Rutas principales de la aplicación (requieren autenticación)
   * Utiliza el layout completo y está protegida por el guard de autenticación
   */
  {
    path: '',
    component: FullComponent,              // Layout completo para la aplicación
    canActivate: [authGuard],             // Protección con guard de autenticación
    children: [
      /**
       * Carga lazy de las rutas de páginas principales
       * Incluye dashboard, pacientes, turnos y otras funcionalidades
       */
      {
        path: '',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
    ],
  },
  
  /**
   * Rutas de autenticación (no requieren autenticación)
   * Utiliza el layout en blanco para páginas de login, error, etc.
   */
  {
    path: '',
    component: BlankComponent,             // Layout en blanco para autenticación
    children: [
      /**
       * Carga lazy de las rutas de autenticación
       * Incluye login, error 404 y otras páginas de autenticación
       */
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
    ],
  },
  
  /**
   * Ruta wildcard - Manejo de rutas no encontradas
   * Cualquier ruta que no coincida con las anteriores se redirige
   * a la página de error 404
   */
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
];
