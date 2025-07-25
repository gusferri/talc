// Importaciones necesarias para el componente Login
// Component: Decorador que define la clase como un componente Angular
import { Component } from '@angular/core';
// CommonModule: Proporciona directivas comunes como *ngIf, *ngFor, etc.
import { CommonModule } from '@angular/common';
// FormsModule: Para formularios template-driven
import { FormsModule } from '@angular/forms';
// Router: Servicio para la navegación entre rutas de la aplicación
import { Router } from '@angular/router';
// HttpClientModule y HttpClient: Para realizar peticiones HTTP al backend
import { HttpClientModule, HttpClient } from '@angular/common/http';
// MatDialog: Para mostrar diálogos modales
import { MatDialog } from '@angular/material/dialog';

// Importaciones de Material Design para UI components
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

// Componente de diálogo para cambio de contraseña
import { ChangePasswordDialogComponent } from '../../../shared/change-password/change-password-dialog.component';
// Configuración del entorno (URLs de la API)
import { environment } from '../../../../environments/environment';

/**
 * Componente Login - Autenticación de usuarios del sistema TALC
 * 
 * Funcionalidades principales:
 * - Autenticación de usuarios mediante username y password
 * - Validación de credenciales contra el backend
 * - Manejo de cambio de contraseña obligatorio
 * - Almacenamiento de información del usuario en localStorage
 * - Redirección al dashboard después del login exitoso
 * - Manejo de errores de autenticación
 * 
 * Responsabilidades:
 * - Proporcionar interfaz de login segura
 * - Validar credenciales del usuario
 * - Gestionar sesiones de usuario
 * - Manejar flujo de cambio de contraseña
 * - Establecer contexto de usuario para la aplicación
 */
@Component({
  selector: 'app-login',                        // Selector CSS para usar el componente
  standalone: true,                             // Componente standalone (no necesita módulo)
  imports: [                                    // Módulos importados para este componente
    CommonModule, 
    FormsModule, 
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',        // Template HTML del componente
  styleUrls: ['./login.component.scss']         // Archivo de estilos específico
})
export class LoginComponent {
  // Username ingresado por el usuario
  username = '';
  
  // Password ingresado por el usuario
  password = '';
  
  // Mensaje de error para mostrar al usuario
  loginError = '';
  
  // Flag para mostrar/ocultar la contraseña en el campo de input
  hidePassword = true;

  /**
   * Constructor del componente
   * Inyecta los servicios necesarios para navegación, HTTP y diálogos
   */
  constructor(
    private router: Router,        // Servicio para navegación entre rutas
    private http: HttpClient,      // Servicio para realizar peticiones HTTP
    private dialog: MatDialog      // Servicio para mostrar diálogos modales
  ) {}

  /**
   * Método principal de autenticación
   * Valida las credenciales del usuario y maneja el flujo de login
   * Incluye manejo de cambio de contraseña obligatorio
   */
  login() {
    // Valida que se hayan ingresado tanto username como password
    if (this.username && this.password) {
      // Realiza petición POST al endpoint de login
      this.http.post<any>(`${environment.apiBaseUrl}/login`, {
        username: this.username,
        password: this.password
      }).subscribe({
        next: (respuesta) => {
          // Verifica si el usuario debe cambiar su contraseña
          if (respuesta.DebeCambiarContrasena) {
            // Abre diálogo obligatorio para cambio de contraseña
            const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
              width: '400px',
              disableClose: true,  // No permite cerrar el diálogo sin cambiar contraseña
              data: { idUsuario: respuesta.ID }
            });

            // Maneja el resultado del diálogo de cambio de contraseña
            dialogRef.afterClosed().subscribe(result => {
              if (result) {
                // Si el usuario cambió la contraseña, la actualiza en el backend
                this.actualizarContrasena(result.currentPassword, result.newPassword);
              }
            });
          } else {
            // Login exitoso sin necesidad de cambiar contraseña
            // Almacena información del usuario en localStorage
            localStorage.setItem('nombreCompleto', `${respuesta.Nombre} ${respuesta.Apellido}`);
            localStorage.setItem('username', respuesta.Username);
            localStorage.setItem('usuario', 'true');
            localStorage.setItem('email', respuesta.Email || '');
            localStorage.setItem('rol', (respuesta.Grupos && respuesta.Grupos.length > 0) ? respuesta.Grupos[0] : '');
            
            // Navega al dashboard después del login exitoso
            this.router.navigate(['/dashboard']);
          }
        },
        error: () => {
          // Maneja errores de autenticación
          this.loginError = 'Usuario o contraseña incorrectos';
        }
      });
    } else {
      // Valida que se hayan completado ambos campos
      this.loginError = 'Debe ingresar usuario y contraseña';
    }
  }

  /**
   * Actualiza la contraseña del usuario en el backend
   * Se ejecuta después de un cambio de contraseña obligatorio
   * 
   * @param currentPassword - Contraseña actual del usuario
   * @param newPassword - Nueva contraseña del usuario
   */
  actualizarContrasena(currentPassword: string, newPassword: string) {
    // Realiza petición POST para cambiar la contraseña
    this.http.post(`${environment.apiBaseUrl}/cambiar-contrasena`, {
      currentPassword: currentPassword,
      newPassword: newPassword
    }).subscribe({
      next: () => {
        // Si el cambio fue exitoso, navega al dashboard
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        // Maneja errores en el cambio de contraseña
        alert('Error al cambiar la contraseña.');
      }
    });
  }
} 