import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificacionesService } from '../../notificaciones.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notificaciones-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './notificaciones-dialog.component.html',
  styleUrl: './notificaciones-dialog.component.css'
})
export class NotificacionesDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { notificaciones: any[] },
    private dialogRef: MatDialogRef<NotificacionesDialogComponent>,
    private notificacionesService: NotificacionesService
  ) {}

  marcarComoLeida(notificacion: any) {
    this.notificacionesService.marcarComoLeida(notificacion.ID).subscribe(() => {
      notificacion.Leido = true;
    });
  }

  cerrar() {
    this.dialogRef.close();
  }
}