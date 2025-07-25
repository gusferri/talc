/**
 * Componente de Diálogo de Cambio de Contraseña - Gestión de cambio de contraseña obligatorio
 *
 * Este componente define un diálogo modal para el cambio de contraseña
 * obligatorio en el sistema TALC, permitiendo a los usuarios actualizar
 * su contraseña de forma segura.
 *
 * Funcionalidades principales:
 * - Formulario de cambio de contraseña con validaciones
 * - Verificación de contraseña actual
 * - Validación de coincidencia de contraseñas nuevas
 * - Integración con backend para actualización
 * - Redirección automática al login después del cambio
 * - Manejo de errores y notificaciones
 * - Control de visibilidad de contraseñas
 *
 * Arquitectura:
 * - Componente standalone con Material Design
 * - Inyección de datos a través de MAT_DIALOG_DATA
 * - Comunicación HTTP directa con el backend
 * - Manejo de estado local y localStorage
 * - Notificaciones con MatSnackBar
 */

// Importaciones de Angular y Material Design
import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Configuración del entorno
import { environment } from '../../../environments/environment';

/**
 * Componente de diálogo para cambio de contraseña
 */
@Component({
  standalone: true,
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  encapsulation: ViewEncapsulation.None
})
export class ChangePasswordDialogComponent {
  /** Contraseña actual del usuario */
  currentPassword = '';
  /** Nueva contraseña deseada */
  newPassword = '';
  /** Confirmación de la nueva contraseña */
  confirmPassword = '';
  /** Nombre de usuario obtenido del diálogo o localStorage */
  username: string = '';
  /** Control de visibilidad de la contraseña actual */
  hideCurrentPassword = true;
  /** Control de visibilidad de la nueva contraseña */
  hideNewPassword = true;
  /** Control de visibilidad de la confirmación de contraseña */
  hideConfirmPassword = true;

  /**
   * Constructor: inicializa el diálogo con servicios y datos
   * 
   * @param dialogRef - Referencia al diálogo para control de cierre
   * @param http - Cliente HTTP para comunicación con el backend
   * @param snackBar - Servicio para mostrar notificaciones
   * @param data - Datos inyectados al diálogo (username)
   */
  constructor(
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Obtiene el username de los datos inyectados o del localStorage
    this.username = data?.username || localStorage.getItem('username') || '';
  }

  /**
   * Guarda la nueva contraseña
   * Valida los campos y envía la solicitud al backend
   */
  guardar() {
    // Validación de coincidencia de contraseñas nuevas
    if (this.newPassword !== this.confirmPassword) {
      alert('Las contraseñas nuevas no coinciden');
      return;
    }

    // Validación de campos obligatorios
    if (!this.currentPassword || !this.newPassword) {
      alert('Todos los campos son obligatorios');
      return;
    }

    // Validación de usuario identificado
    if (!this.username) {
      alert('Error: Usuario no identificado');
      return;
    }

    // Preparación del payload para el backend
    const payload = {
      username: this.username,
      contrasena_actual: this.currentPassword,
      nueva_contrasena: this.newPassword
    };
    console.log('Payload enviado al backend:', payload);

    // Envío de la solicitud al backend
    this.http.post(`${environment.apiBaseUrl}/cambiar-contrasena`, payload, {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: (response: any) => {
        // Notificación de éxito
        this.snackBar.open('Contraseña actualizada exitosamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });

        // Limpieza de localStorage y redirección al login
        setTimeout(() => {
          localStorage.clear();           // Limpia toda la información de sesión
          this.dialogRef.close(true);     // Cierra el diálogo con éxito
          window.location.href = '/login'; // Redirecciona al login
        }, 1000);
      },
      error: (err) => {
        console.error(err);
        alert('Error al actualizar la contraseña');
      }
    });
  }

  /**
   * Cancela el cambio de contraseña
   * Cierra el diálogo sin realizar cambios
   */
  cancelar() {
    this.dialogRef.close(null);
  }
} 