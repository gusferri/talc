// Importaciones necesarias para la configuración de rutas de autenticación
// Routes: Tipo de Angular Router que define la estructura de navegación
import { Routes } from '@angular/router';

// Importaciones de componentes de autenticación
import { AppErrorComponent } from './error/error.component';  // Componente para manejar errores 404
import { LoginComponent } from './login/login.component';     // Componente de login

/**
 * Configuración de rutas de autenticación del sistema TALC
 * 
 * Este archivo define las rutas relacionadas con la autenticación y manejo de errores
 * del sistema. Incluye rutas para login y páginas de error.
 * 
 * Estructura de navegación:
 * - /authentication/login: Página de login del sistema
 * - /authentication/error: Página de error 404 (página no encontrada)
 * - /authentication: Redirige automáticamente a login
 * 
 * Características:
 * - Rutas anidadas bajo el path 'authentication'
 * - Redirección automática a login cuando se accede a la raíz
 * - Manejo centralizado de errores de navegación
 * - Separación clara entre funcionalidades de autenticación
 */
export const AuthenticationRoutes: Routes = [
  {
    path: '',                    // Ruta raíz de autenticación
    children: [                  // Rutas hijas anidadas
      {
        path: 'error',           // Ruta para página de error
        component: AppErrorComponent,  // Componente que maneja errores 404
      },
      {
        path: 'login',           // Ruta para página de login
        component: LoginComponent,     // Componente de autenticación
      },
      {
        path: '',                // Ruta raíz de autenticación
        redirectTo: 'login',     // Redirige automáticamente a login
        pathMatch: 'full'        // Coincidencia exacta del path
      }
    ],
  },
];
