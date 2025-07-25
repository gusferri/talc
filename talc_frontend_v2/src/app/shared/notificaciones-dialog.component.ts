/**
 * Componente de Diálogo de Notificaciones - Visualización y gestión de notificaciones
 *
 * Este componente define un diálogo modal para mostrar las notificaciones
 * del usuario en el sistema TALC, permitiendo visualizar y marcar como
 * leídas las notificaciones pendientes.
 *
 * Funcionalidades principales:
 * - Visualización de lista de notificaciones
 * - Marcado de notificaciones como leídas
 * - Integración con Material Dialog
 * - Comunicación con el servicio de notificaciones
 * - Interfaz modal para gestión de notificaciones
 *
 * Arquitectura:
 * - Componente standalone con Material Design
 * - Inyección de datos a través de MAT_DIALOG_DATA
 * - Comunicación con servicio de notificaciones
 * - Manejo de estado de notificaciones
 */

// Importaciones de Angular y Material Design
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

// Servicios
import { NotificacionesService } from '../services/notificaciones.service';

/**
 * Componente de diálogo para gestión de notificaciones
 */
@Component({
  selector: 'app-notificaciones-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './notificaciones-dialog.component.html',
  styleUrl: './notificaciones-dialog.component.scss'
})
export class NotificacionesDialogComponent {
  /**
   * Constructor: inicializa el diálogo con datos y servicios
   * 
   * @param data - Datos inyectados al diálogo (lista de notificaciones)
   * @param dialogRef - Referencia al diálogo para control de cierre
   * @param notificacionesService - Servicio para gestionar notificaciones
   */
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { notificaciones: any[] },
    private dialogRef: MatDialogRef<NotificacionesDialogComponent>,
    private notificacionesService: NotificacionesService
  ) {}

  /**
   * Marca una notificación como leída
   * Actualiza el estado en el backend y en la interfaz local
   * 
   * @param noti - Notificación a marcar como leída
   */
  marcarComoLeida(noti: any) {
    // Llama al servicio para marcar como leída en el backend
    this.notificacionesService.marcarComoLeido(noti.ID).subscribe(() => {
      // Actualiza el estado local de la notificación
      noti.Leido = true;
    });
  }

  /**
   * Cierra el diálogo de notificaciones
   * Cierra el modal sin realizar ninguna acción adicional
   */
  cerrar() {
    this.dialogRef.close();
  }
} 