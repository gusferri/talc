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
    MatProgressSpinnerModule
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
} 