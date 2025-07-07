import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TurnosService } from '../../turnos/services/turnos.service';
import { CustomSnackbarComponent } from '../../shared/custom-snackbar/custom-snackbar.component';

@Component({
  selector: 'app-turno-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title class="titulo-dialogo">Turno Seleccionado</h2>
    <mat-dialog-content class="contenido-dialogo">
      <p><strong>Paciente:</strong> {{ data.paciente }}</p>
      <p><strong>Profesional:</strong> {{ data.profesional }}</p>
      <p><strong>Especialidad:</strong> {{ data.especialidad }}</p>
      <p><strong>Fecha:</strong> {{ data.fecha | date: 'dd-MM-yyyy' }}</p>
      <p><strong>Hora:</strong> {{ data.hora }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button *ngIf="mostrarBotonAsistencia" mat-button class="estilo-boton" (click)="onRegistrarAsistencia()">Registrar Asistencia</button>
      <button *ngIf="mostrarBotonesModificar" mat-button class="estilo-boton" (click)="onEditar()">Editar Turno</button>
      <button *ngIf="mostrarBotonesModificar" mat-button class="estilo-boton" (click)="onCancelar()">Cancelar Turno</button>
      <button mat-button class="estilo-boton" (click)="onCerrar()">Cerrar Ventana</button>
    </mat-dialog-actions>
  `,
  styleUrls: ['./turno-dialog.component.css'] // Vincula el archivo CSS
})
export class TurnoDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TurnoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router,
    private turnosService: TurnosService,
    private snackBar: MatSnackBar
  ) {}

  get mostrarBotonAsistencia(): boolean {
    const ahora = new Date();
    const [horaStr, minutoStr] = this.data.hora.split(':');
    const hora = parseInt(horaStr, 10);
    const minuto = parseInt(minutoStr, 10);
    const [anio, mes, dia] = this.data.fecha.split('-').map(Number);
    const fechaTurno = new Date(anio, mes - 1, dia, hora, minuto);

    const inicioVentana = new Date(fechaTurno.getTime() - 15 * 60000);
    const finVentana = new Date(fechaTurno.getTime() + 60 * 60000);

    return ahora >= inicioVentana && ahora <= finVentana && this.data.estado !== 2;
  }

  get mostrarBotonesModificar(): boolean {
    const ahora = new Date();
    const [horaStr, minutoStr] = this.data.hora.split(':');
    const hora = parseInt(horaStr, 10);
    const minuto = parseInt(minutoStr, 10);
    const [anio, mes, dia] = this.data.fecha.split('-').map(Number);
    const fechaTurno = new Date(anio, mes - 1, dia, hora, minuto);

    return ahora < fechaTurno;
  }

  onEditar(): void {
    this.dialogRef.close();
    this.router.navigate(['/turnos/nuevo-turno'], {
      queryParams: {
        turnoID: this.data.turnoID
      }
    });
  }

  onCancelar(): void {
    // Estado 3 corresponde a "cancelado"
    this.turnosService.actualizarEstadoTurno(this.data.turnoID, 3).subscribe({
      next: () => {
        console.log('✅ Turno cancelado correctamente');
        this.snackBar.openFromComponent(CustomSnackbarComponent, {
          data: { message: 'Turno Cancelado', icon: 'check_circle' },
          duration: 3000,
          panelClass: ['centered-snackbar']
        });
        this.dialogRef.close({ accion: 'cancelado', turnoID: this.data.turnoID });
        window.location.href = '/turnos/calendario';
      },
      error: (err) => {
        console.error('❌ Error al cancelar el turno', err);
        this.snackBar.openFromComponent(CustomSnackbarComponent, {
          data: { message: 'Error al cancelar el turno', icon: 'error' },
          duration: 3000,
          panelClass: ['centered-snackbar']
        });
        this.dialogRef.close();
      }
    });
  }

  onCerrar(): void {
    this.dialogRef.close();
  }

  onRegistrarAsistencia(): void {
    this.turnosService.registrarAsistencia(this.data.turnoID).subscribe({
      next: () => {
        console.log('✅ Asistencia registrada correctamente');
        this.snackBar.openFromComponent(CustomSnackbarComponent, {
          data: { message: 'Asistencia Registrada', icon: 'check_circle' },
          duration: 3000,
          panelClass: ['centered-snackbar']
        });
        this.dialogRef.close({ accion: 'asistencia', turnoID: this.data.turnoID });
        window.location.href = 'turnos/calendario';
      },
      error: (err) => {
        console.error('❌ Error al registrar asistencia', err);
        this.snackBar.openFromComponent(CustomSnackbarComponent, {
          data: { message: 'Error al registrar asistencia', icon: 'error' },
          duration: 3000,
          panelClass: ['centered-snackbar']
        });
        this.dialogRef.close();
      }
    });
  }
}
