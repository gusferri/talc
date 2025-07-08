import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PacienteService } from '../../../services/paciente.service';
import { debounceTime, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { DialogNotaVozComponent } from './dialog-nota-voz.component';
import { NotasVozService } from '../../../services/notas-voz.service';

@Component({
  selector: 'app-notas-voz-por-paciente',
  standalone: true,
  templateUrl: './notas-voz-por-paciente.component.html',
  styleUrls: ['./notas-voz-por-paciente.component.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatTableModule,
    ReactiveFormsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatButtonModule
  ]
})
export class NotasVozPorPacienteComponent implements OnInit {
  pacienteControl = new FormControl('');
  pacientes: any[] = [];
  pacientesFiltrados: any[] = [];
  pacienteSeleccionado: any = null;
  turnos: any[] = [];
  displayedColumns = ['fecha', 'hora', 'notaVoz', 'acciones'];
  isLoading: boolean = false;
  private pacienteService = inject(PacienteService);
  sesionSeleccionada: any = null;
  transcripcion: string = '';
  idNotaVoz: number | null = null;
  private dialog: MatDialog;
  private notasVozService = inject(NotasVozService);

  constructor(dialog: MatDialog) {
    this.dialog = dialog;
  }

  ngOnInit(): void {
    const shortname = localStorage.getItem('username');
    if (shortname) {
      this.pacienteService.obtenerPacientesPorProfesional(shortname).subscribe((pacientes: any[]) => {
        this.pacientes = pacientes;
        this.pacientesFiltrados = pacientes;
      });
    }
    this.pacienteControl.valueChanges
      .pipe(
        debounceTime(300),
        switchMap(value => {
          if (typeof value === 'string' && value.length > 1) {
            const filtro = value.toLowerCase();
            return of(
              this.pacientes.filter(p =>
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
    if (paciente && paciente.ID) {
      this.pacienteService.obtenerTurnosPorPaciente(paciente.ID).subscribe((turnos: any[]) => {
        // Filtrar solo los turnos en estado Asistido (5)
        this.turnos = (turnos || []).filter(t => t.EstadoTurno === 'Asistido' || t.EstadoTurno === 5 || t.estado === 'Asistido' || t.estado === 5)
          .map(t => ({
            ...t,
            tieneNotaVoz: !!(t.ID_NotaVoz || t.id_nota_voz)
          }));
      });
    } else {
      this.turnos = [];
    }
  }

  editarNotaVoz(turno: any) {
    // Lógica para editar la nota de voz
  }

  cargarNotaVoz(idNotaVoz: number, sesion?: any) {
    if (!idNotaVoz) return;
    if (sesion) {
      this.sesionSeleccionada = sesion;
    }
    // Aquí deberías llamar a tu servicio de notas de voz para obtener la transcripción
    // Ejemplo:
    // this.notasVozService.obtenerNotaVoz(idNotaVoz).subscribe(resp => {
    //   this.transcripcion = resp.texto;
    //   this.idNotaVoz = idNotaVoz;
    // });
    // Por ahora, simula:
    this.transcripcion = 'Transcripción de ejemplo para la nota de voz.';
    this.idNotaVoz = idNotaVoz;
  }

  guardarEdicionNotaVoz() {
    if (!this.idNotaVoz || !this.transcripcion) return;
    // Aquí deberías llamar a tu servicio para guardar la transcripción editada
    // this.notasVozService.actualizarNotaVoz(this.idNotaVoz, this.transcripcion).subscribe(...)
    alert('Transcripción guardada (simulado)');
  }

  limpiarFormulario() {
    this.transcripcion = '';
    this.idNotaVoz = null;
    this.sesionSeleccionada = null;
  }

  abrirDialogNotaVoz(turno: any) {
    // Determinar el ID correcto de la nota de voz
    const idNotaVoz = turno.ID_NotaVoz || turno.id_nota_voz;
    console.log('Intentando obtener nota de voz para ID:', idNotaVoz, 'Turno:', turno);
    if (!idNotaVoz) {
      alert('No hay nota de voz asociada a este turno.');
      return;
    }
    // Mostrar loading mientras se obtiene la nota
    const dialogRef = this.dialog.open(DialogNotaVozComponent, {
      data: {
        turno,
        paciente: this.pacienteSeleccionado,
        transcripcion: '',
        loading: true
      },
      width: '600px'
    });
    this.notasVozService.obtenerNotaVoz(idNotaVoz).subscribe({
      next: (resp: any) => {
        console.log('Respuesta obtenerNotaVoz:', resp);
        dialogRef.componentInstance.transcripcion = resp.texto || resp.transcripcion || resp.text || '';
        dialogRef.componentInstance.loading = false;
      },
      error: () => {
        dialogRef.componentInstance.transcripcion = '';
        dialogRef.componentInstance.loading = false;
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.transcripcion !== undefined) {
        turno.transcripcion = result.transcripcion;
      }
    });
  }
} 