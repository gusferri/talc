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
import { ActivatedRoute } from '@angular/router';
import { DialogInformeEvolutivoComponent } from './dialog-informe-evolutivo.component';
import { InformesService } from '../../../services/informes.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-seguimiento-evolutivo-por-paciente',
  standalone: true,
  templateUrl: './seguimiento-evolutivo-por-paciente.component.html',
  styleUrls: ['./seguimiento-evolutivo-por-paciente.component.scss'],
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
export class SeguimientoEvolutivoPorPacienteComponent implements OnInit {
  pacienteControl = new FormControl('');
  pacientes: any[] = [];
  pacientesFiltrados: any[] = [];
  pacienteSeleccionado: any = null;
  informes: any[] = [];
  displayedColumns = ['fecha', 'tipoInforme', 'profesional', 'acciones'];
  isLoading: boolean = false;
  informeSeleccionado: any = null;
  private pacienteService = inject(PacienteService);
  private informesService = inject(InformesService);
  private dialog: MatDialog;
  private route: ActivatedRoute;

  constructor(dialog: MatDialog, route: ActivatedRoute, private snackBar: MatSnackBar) {
    this.dialog = dialog;
    this.route = route;
  }

  ngOnInit(): void {
    const shortname = localStorage.getItem('username');
    if (shortname) {
      this.pacienteService.obtenerPacientesPorProfesional(shortname).subscribe((pacientes: any[]) => {
        this.pacientes = pacientes;
        this.pacientesFiltrados = pacientes;
        // Selección automática por query param
        this.route.queryParams.subscribe(params => {
          const pacienteId = params['pacienteId'];
          if (pacienteId) {
            const paciente = pacientes.find(p => p.ID == pacienteId || p.id == pacienteId);
            if (paciente) {
              this.pacienteControl.setValue(paciente);
              this.onPacienteSeleccionado({ option: { value: paciente } });
            }
          }
        });
      });
    }
    this.pacienteControl.valueChanges
      .pipe(
        debounceTime(300),
        switchMap(value => {
          if (typeof value === 'string' && value.length > 0) {
            const filtro = value.toLowerCase();
            return of(
              this.pacientes.filter(p =>
                (`${p.Nombre} ${p.Apellido}`.toLowerCase().includes(filtro) ||
                 `${p.Apellido} ${p.Nombre}`.toLowerCase().includes(filtro))
              )
            );
          } else {
            // Si es objeto, mostrar todos
            return of(this.pacientes);
          }
        })
      )
      .subscribe((pacientes: any[]) => {
        this.pacientesFiltrados = pacientes;
      });
  }

  displayPaciente(paciente: any): string {
    return paciente && paciente.Apellido ? `${paciente.Apellido}, ${paciente.Nombre}` : '';
  }

  onPacienteSeleccionado(event: any) {
    const paciente = event.option.value;
    this.pacienteSeleccionado = paciente;
    this.informeSeleccionado = null;
    if (paciente && paciente.ID) {
      this.isLoading = true;
      const username = localStorage.getItem('username');
      this.pacienteService.obtenerProfesionalPorUsername(username || '').subscribe((profesional: any) => {
        const idProfesional = profesional?.ID;
        this.informesService.getInformesPorPaciente(paciente.ID).subscribe({
          next: (informes: any) => {
            const lista = Array.isArray(informes) ? informes : (informes && (informes as any).informes ? (informes as any).informes : []);
            // Filtrar: interdisciplinarios (TipoInforme === 2) de cualquiera, específicos (TipoInforme === 1) solo del profesional logueado
            this.informes = lista.filter((i: any) =>
              (i.TipoInforme === 2) || (i.TipoInforme === 1 && i.ID_Profesional === idProfesional)
            );
            this.isLoading = false;
          },
          error: () => {
            this.informes = [];
            this.isLoading = false;
          }
        });
      });
    } else {
      this.informes = [];
    }
  }

  abrirDialogInforme(informe: any) {
    this.dialog.open(DialogInformeEvolutivoComponent, {
      data: {
        informe,
        paciente: this.pacienteSeleccionado
      },
      width: '600px'
    });
  }

  guardarEdicionInforme() {
    // Lógica para guardar la edición del informe
    // Por ahora, solo simula
    alert('Edición de informe guardada (simulado)');
  }

  limpiarFormulario() {
    this.informeSeleccionado = null;
  }

  generarInforme(tipo: 'area' | 'interdisciplinario') {
    if (!this.pacienteSeleccionado) {
      this.snackBar.open('Selecciona un paciente primero.', 'Cerrar', { duration: 3000 });
      return;
    }
    const username = localStorage.getItem('username');
    this.pacienteService.obtenerProfesionalPorUsername(username || '').subscribe((profesional: any) => {
      const idProfesional = profesional?.ID;
      if (!idProfesional) {
        this.snackBar.open('No se pudo obtener el profesional logueado.', 'Cerrar', { duration: 3000 });
        return;
      }
      const payload = {
        ID_Paciente: this.pacienteSeleccionado.ID,
        ID_Profesional: idProfesional,
        TipoInforme: tipo
      };
      this.informesService.createInformeIA(payload).subscribe({
        next: (res) => {
          this.snackBar.open('Informe generado correctamente.', 'Cerrar', { duration: 2500 });
          // Recargar informes
          this.onPacienteSeleccionado({ option: { value: this.pacienteSeleccionado } });
        },
        error: (err) => {
          this.snackBar.open('Error al generar informe.', 'Cerrar', { duration: 4000 });
        }
      });
    });
  }
} 