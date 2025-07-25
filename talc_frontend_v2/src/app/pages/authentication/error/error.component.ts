// Importaciones necesarias para el componente Error
// Component: Decorador que define la clase como un componente Angular
import { Component } from '@angular/core';
// RouterModule y Router: Para navegación entre rutas de la aplicación
import { RouterModule, Router } from '@angular/router';
// MatButtonModule: Para botones de Material Design
import { MatButtonModule } from '@angular/material/button';

/**
 * Componente AppErrorComponent - Página de error 404 del sistema TALC
 * 
 * Funcionalidades principales:
 * - Muestra una página de error amigable cuando se accede a una ruta inexistente
 * - Proporciona opciones de navegación para volver al sistema
 * - Interfaz visual atractiva para manejar errores de navegación
 * - Redirección a páginas principales del sistema
 * 
 * Responsabilidades:
 * - Manejar errores de navegación (404 - Página no encontrada)
 * - Proporcionar experiencia de usuario positiva en caso de error
 * - Facilitar la navegación de regreso al sistema
 * - Mantener consistencia visual con el resto de la aplicación
 * 
 * Casos de uso:
 * - Usuario accede a una URL inexistente
 * - Enlaces rotos o mal configurados
 * - Navegación manual a rutas no definidas
 * - Redirección desde rutas protegidas sin autorización
 */
@Component({
    selector: 'app-error',                    // Selector CSS para usar el componente
    standalone: true,                         // Componente standalone (no necesita módulo)
    imports: [RouterModule, MatButtonModule], // Módulos importados para este componente
    templateUrl: './error.component.html'     // Template HTML del componente
})
export class AppErrorComponent {
    /**
     * Constructor del componente
     * Inyecta el servicio Router para navegación
     */
    constructor(private router: Router) {}

    /**
     * Navega al componente de login
     * Permite al usuario volver a la página de autenticación
     * Útil cuando el error ocurre por problemas de autorización
     */
    irALogin(): void {
        this.router.navigate(['/authentication/login']);
    }

    /**
     * Navega al dashboard principal
     * Permite al usuario volver a la página principal del sistema
     * Útil cuando el usuario está autenticado pero accedió a una ruta inexistente
     */
    irADashboard(): void {
        this.router.navigate(['/dashboard']);
    }
}
