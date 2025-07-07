import { Component, inject, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { PacienteService } from '../paciente.service';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { DialogNotaVozComponent } from '../../shared/dialog-nota-voz/dialog-nota-voz.component';
import { MatButtonModule } from '@angular/material/button';
import { NotasVozService } from '../../pacientes/notas-voz.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-notas-voz',
  standalone: true,
  templateUrl: './notas-voz.component.html',
  styleUrl: './notas-voz.component.css',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatButtonModule,
  ],
  providers: [PacienteService]
})
export class NotasVozComponent {
  pacienteControl = new FormControl('');
  pacientesFiltrados: any[] = [];
  pacienteSeleccionado: any = null;
  sesiones: any[] = [];
  sesionSeleccionada: any = null;
  displayedColumns: string[] = ['fecha', 'hora', 'estado', 'notaVoz', 'acciones'];
  private pacienteService = inject(PacienteService);
  transcripcion: string = '';
  idNotaVoz: number | null = null;
  mensaje: string = '';
  private notasVozService = inject(NotasVozService);

    pacientesProfesional: any[] = [];

  constructor(private dialog: MatDialog, private snackBar: MatSnackBar) {
    const shortname = localStorage.getItem('username');
    if (shortname) {
      this.pacienteService.obtenerPacientesPorProfesional(shortname).subscribe((pacientes: any[]) => {
        this.pacientesProfesional = pacientes;
      });
    }

    this.pacienteControl.valueChanges
      .pipe(
        debounceTime(300),
        switchMap(value => {
          if (typeof value === 'string' && value.length > 1) {
            const filtro = value.toLowerCase();
            return of(
              this.pacientesProfesional.filter(p =>
                (`${p.Nombre} ${p.Apellido}`.toLowerCase().includes(filtro) ||
                 `${p.Apellido} ${p.Nombre}`.toLowerCase().includes(filtro))
              )
            );
          } else {
            return of([]);
          }
        })
      )
      .subscribe((pacientes: any[]) => {
        this.pacientesFiltrados = pacientes;
      });
  }

  displayPaciente(paciente: any): string {
    return paciente ? `${paciente.Apellido}, ${paciente.Nombre}` : '';
  }

  onPacienteSeleccionado(event: any) {
    const paciente = event.option.value;
    this.pacienteSeleccionado = paciente;
    console.log('Paciente seleccionado:', paciente);
    this.sesiones = [];
    if (paciente) {
      this.pacienteService.obtenerTurnosPorPaciente(paciente.ID).subscribe((turnos: any[]) => {
        console.log('Turnos obtenidos:', turnos);
        const ahora = new Date();
        const turnosPasados = turnos.filter(t => {
          const fecha = new Date(t.Fecha || t.fecha);
          const hora = t.Hora || t.hora || '00:00';
          const dateTime = new Date(`${fecha.toISOString().substring(0,10)}T${hora.length === 5 ? hora + ':00' : hora}`);
          return dateTime < ahora;
        }).map(t => ({
          ...t,
          tieneNotaVoz: !!t.ID_NotaVoz // Cambiá el campo por el que venga del backend si es necesario
        }));
        this.sesiones = turnosPasados.sort((a, b) => {
          const fechaA = new Date(a.Fecha || a.fecha);
          const fechaB = new Date(b.Fecha || b.fecha);
          return fechaB.getTime() - fechaA.getTime();
        });
      });
    }
  }

  onSesionSeleccionada(event: any) {
    this.sesionSeleccionada = event.value;
  }

  abrirDialogNotaVoz(sesion: any): void {
    this.sesionSeleccionada = sesion;
    const dialogRef = this.dialog.open(DialogNotaVozComponent, {
      data: { sesion, paciente: this.pacienteSeleccionado }
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      // Al cerrar el diálogo, busco la transcripción de la nota recién grabada (si existe)
      if (sesion && sesion.ID) {
        this.notasVozService.obtenerNotaVoz(sesion.ID)
          .subscribe({
            next: (resp: any) => {
              this.transcripcion = resp.texto;
              this.idNotaVoz = resp.id;
            },
            error: (err: any) => {
              this.transcripcion = '';
              this.idNotaVoz = null;
            }
          });
      }
    });
  }

  guardarEdicionNotaVoz() {
    if (!this.idNotaVoz || !this.transcripcion) return;
    this.notasVozService.actualizarNotaVoz(this.idNotaVoz, this.transcripcion)
      .subscribe({
        next: (resp: any) => {
          this.snackBar.open('Nota editada correctamente', 'Cerrar', {
            duration: 2500,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snackbar-exito']
          });
        },
        error: (err: any) => {
          this.snackBar.open('Error al editar la nota', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snackbar-error']
          });
        }
      });
  }

  cargarNotaVoz(idNotaVoz: number, sesion?: any) {
    if (!idNotaVoz) return;
    if (sesion) {
      this.sesionSeleccionada = sesion;
    }
    this.notasVozService.obtenerNotaVoz(idNotaVoz)
      .subscribe({
        next: (resp: any) => {
          this.transcripcion = resp.texto;
          this.idNotaVoz = idNotaVoz;
        },
        error: (err: any) => {
          this.transcripcion = '';
          this.idNotaVoz = null;
        }
      });
  }

  limpiarFormulario() {
    location.reload();
  }

}