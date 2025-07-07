import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { TurnosService } from '../../services/turnos.service';
import { PacienteService } from '../../services/paciente.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, startWith, map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-nuevo-turno',
  standalone: true,
  templateUrl: './nuevo-turno.component.html',
  styleUrls: ['./nuevo-turno.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatIconModule
  ]
})
export class NuevoTurnoComponent implements OnInit {
  form!: FormGroup;
  pacientes: any[] = [];
  profesionales: any[] = [];
  especialidades: any[] = [];
  especialidadesFiltradas: any[] = [];
  horasDisponibles: string[] = [
    '08:00', '09:00', '10:00', '11:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00',
  ];
  horasFiltradas: string[] = [];
  turnos: any[] = [];
  isLoading = false;
  today: Date = new Date();
  filteredPacientes!: Observable<any[]>;
  filteredProfesionales!: Observable<any[]>;
  modoEdicion: boolean = false;
  idTurnoEditar: number | null = null;
  pacientesCargados = false;
  profesionalesCargados = false;
  especialidadesCargadas = false;
  turnoParaEditar: any = null;

  constructor(
    private fb: FormBuilder,
    private turnosService: TurnosService,
    private pacienteService: PacienteService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      ID_Paciente: [null, Validators.required],
      pacienteCtrl: [''],
      ID_Profesional: [null, Validators.required],
      profesionalCtrl: [''],
      ID_Especialidad: [null, Validators.required],
      Fecha: [null, Validators.required],
      Hora: [null, Validators.required],
    });
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.modoEdicion = true;
        this.idTurnoEditar = +id;
        this.turnosService.obtenerTurnoPorId(+id).subscribe(turno => {
          this.turnoParaEditar = turno;
          this.cargarEspecialidadesPorProfesional(turno.ID_Profesional);
          this.intentarPatch();
        });
      }
    });
    this.cargarPacientes();
    this.cargarProfesionales();
    this.cargarTurnos();
    this.form.get('Fecha')?.valueChanges.subscribe(() => {
      this.filtrarHorasDisponibles();
    });
    this.form.get('ID_Profesional')?.valueChanges.subscribe(id => {
      this.cargarEspecialidadesPorProfesional(id);
      this.form.get('ID_Especialidad')?.reset();
    });
    this.form.get('ID_Profesional')?.valueChanges.subscribe(() => {
      this.filtrarHorasDisponibles();
    });
    this.form.get('ID_Paciente')?.valueChanges.subscribe(() => {
      this.filtrarHorasDisponibles();
    });
    this.filteredPacientes = this.form.get('pacienteCtrl')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPacientes(value || ''))
    );
    this.filteredProfesionales = this.form.get('profesionalCtrl')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterProfesionales(value || ''))
    );
  }

  private _filterPacientes(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.pacientes.filter(p =>
      (p.Nombre && p.Nombre.toLowerCase().includes(filterValue)) ||
      (p.Apellido && p.Apellido.toLowerCase().includes(filterValue))
    );
  }

  private _filterProfesionales(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.profesionales.filter(p =>
      (p.nombre && p.nombre.toLowerCase().includes(filterValue)) ||
      (p.apellido && p.apellido.toLowerCase().includes(filterValue))
    );
  }

  seleccionarPaciente(paciente: any) {
    this.form.get('ID_Paciente')?.setValue(paciente.ID);
  }

  seleccionarProfesional(profesional: any) {
    this.form.get('ID_Profesional')?.setValue(profesional.ID);
  }

  cargarTurnos() {
    this.turnosService.obtenerTurnos().subscribe(data => {
      this.turnos = data;
      this.cdr.detectChanges();
      // Log de ejemplo de turno
      if (this.turnos.length > 0) {
        console.log('🟢 Primer turno en this.turnos:', this.turnos[0]);
        const turnoPaciente = this.turnos.find(t => t.ID_Paciente?.toString() === this.form.get('ID_Paciente')?.value?.toString());
        if (turnoPaciente) {
          console.log('🔵 Turno con mismo paciente:', turnoPaciente);
        }
        const turnoProfesional = this.turnos.find(t => t.ID_Profesional?.toString() === this.form.get('ID_Profesional')?.value?.toString());
        if (turnoProfesional) {
          console.log('🟣 Turno con mismo profesional:', turnoProfesional);
        }
      }
    });
  }

  filtrarHorasDisponibles() {
    const fecha = this.form.get('Fecha')?.value;
    const idProfesional = this.form.get('ID_Profesional')?.value;
    const idPaciente = this.form.get('ID_Paciente')?.value;
    if (!fecha || !idProfesional || !idPaciente) {
      this.horasFiltradas = [];
      return;
    }
    const fechaStr = this.formatearFecha(fecha);
    this.horasFiltradas = this.horasDisponibles.filter(hora => {
      return this.verificarDisponibilidad(hora, fechaStr, idProfesional, idPaciente);
    });
    this.form.get('Hora')?.setValue(null);
    this.cdr.detectChanges();
  }

  verificarDisponibilidad(hora: string, fecha: string, _idProfesional: number, _idPaciente: number): boolean {
    // No permitir turnos en el pasado
    const hoy = new Date();
    const fechaHora = new Date(`${fecha}T${hora}`);
    if (fechaHora < hoy) return false;

    // Obtener nombre completo del paciente y profesional seleccionados
    const pacienteSeleccionado = this.form.get('pacienteCtrl')?.value;
    const profesionalSeleccionado = this.form.get('profesionalCtrl')?.value;
    const nombrePaciente = pacienteSeleccionado?.Nombre
      ? `${pacienteSeleccionado.Nombre} ${pacienteSeleccionado.Apellido || ''}`.trim()
      : pacienteSeleccionado?.nombre
        ? `${pacienteSeleccionado.nombre} ${pacienteSeleccionado.apellido || ''}`.trim()
        : '';
    const nombreProfesional = profesionalSeleccionado?.Nombre
      ? `${profesionalSeleccionado.Nombre} ${profesionalSeleccionado.Apellido || ''}`.trim()
      : profesionalSeleccionado?.nombre
        ? `${profesionalSeleccionado.nombre} ${profesionalSeleccionado.apellido || ''}`.trim()
        : '';

    const turnosConflictivos = this.turnos.filter(t => {
      const horaTurno = (t.Hora || '').toString().substring(0, 5);
      const horaSeleccionada = hora.toString().substring(0, 5);
      return (
        t.Fecha === fecha &&
        horaTurno === horaSeleccionada &&
        (t.Paciente === nombrePaciente || t.Profesional === nombreProfesional) &&
        t.Estado === 'Agendado'
      );
    });

    if (turnosConflictivos.length > 0) {
      console.log('⚠️ Turno conflictivo encontrado:', turnosConflictivos[0]);
    }

    console.log('🔍 Verificando disponibilidad:', {
      hora,
      fecha,
      nombrePaciente,
      nombreProfesional,
      cantidadConflictivos: turnosConflictivos.length,
      turnosConflictivos: turnosConflictivos.map(t => ({
        ID: t.ID,
        Paciente: t.Paciente,
        Profesional: t.Profesional,
        Estado: t.Estado,
        Fecha: t.Fecha,
        Hora: t.Hora
      }))
    });

    return turnosConflictivos.length === 0;
  }

  formatearFecha(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  guardarTurno() {
    if (this.form.invalid) {
      this.snackBar.open('Por favor completá todos los campos requeridos.', 'Cerrar', { duration: 3000 });
      return;
    }
    const raw = this.form.getRawValue();
    const nuevoTurno = {
      ID_Paciente: raw.ID_Paciente,
      ID_Profesional: raw.ID_Profesional,
      ID_Especialidad: raw.ID_Especialidad,
      Fecha: this.formatearFecha(raw.Fecha),
      Hora: raw.Hora,
      ID_EstadoTurno: 1
    };
    if (this.modoEdicion && this.idTurnoEditar) {
      this.turnosService.actualizarTurno(this.idTurnoEditar, nuevoTurno).subscribe({
        next: () => {
          this.snackBar.open('Turno editado con éxito', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/turnos']);
        },
        error: () => {
          this.snackBar.open('Error al editar el turno', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      this.turnosService.crearTurno(nuevoTurno).subscribe({
        next: () => {
          this.snackBar.open('Turno guardado con éxito', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/turnos']);
        },
        error: () => {
          this.snackBar.open('Error al guardar el turno', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  cancelar() {
    this.router.navigate(['/turnos']);
  }

  displayPaciente(paciente: any): string {
    if (!paciente) return '';
    if (typeof paciente === 'string') return paciente;
    return paciente.Nombre ? `${paciente.Nombre} ${paciente.Apellido || ''}`.trim() : '';
  }

  displayProfesional(profesional: any): string {
    return profesional && profesional.nombre ? profesional.nombre : '';
  }

  get pacienteCtrl() {
    return this.form.get('pacienteCtrl') as import('@angular/forms').FormControl;
  }
  get profesionalCtrl() {
    return this.form.get('profesionalCtrl') as import('@angular/forms').FormControl;
  }

  estaOcupado(hora: string): boolean {
    const fecha = this.form.get('Fecha')?.value;
    const idProfesional = this.form.get('ID_Profesional')?.value;
    const idPaciente = this.form.get('ID_Paciente')?.value;
    
    console.log('🔍 Verificando si hora está ocupada:', {
      hora,
      fecha,
      idProfesional,
      idPaciente,
      turnos: this.turnos.length
    });
    
    if (!fecha || !idProfesional || !idPaciente) {
      console.log('❌ Faltan datos para validar disponibilidad');
      return false;
    }
    
    const fechaStr = this.formatearFecha(fecha);
    const ocupado = !this.verificarDisponibilidad(hora, fechaStr, idProfesional, idPaciente);
    
    console.log(`⏰ Hora ${hora} está ocupada: ${ocupado}`);
    return ocupado;
  }

  intentarPatch() {
    if (
      this.modoEdicion &&
      this.pacientesCargados &&
      this.profesionalesCargados &&
      this.especialidadesCargadas &&
      this.turnoParaEditar
    ) {
      const pacienteObj = this.pacientes.find(p => p.ID === this.turnoParaEditar.ID_Paciente);
      const profesionalObj = this.profesionales.find(p => p.ID === this.turnoParaEditar.ID_Profesional);
      const especialidadObj = Array.isArray(this.especialidadesFiltradas)
        ? this.especialidadesFiltradas.find(e => e.ID === this.turnoParaEditar.ID_Especialidad)
        : undefined;
      console.log('Especialidades filtradas:', this.especialidadesFiltradas);
      console.log('Especialidad seleccionada:', especialidadObj);
      // Convertir fecha a Date y hora a string HH:mm
      let fechaValue = this.turnoParaEditar.Fecha;
      if (fechaValue && typeof fechaValue === 'string') {
        fechaValue = new Date(fechaValue);
      }
      let horaValue = this.turnoParaEditar.Hora;
      if (horaValue && typeof horaValue === 'string') {
        horaValue = horaValue.substring(0,5);
      }
      this.form.patchValue({
        ID_Paciente: this.turnoParaEditar.ID_Paciente,
        pacienteCtrl: pacienteObj || '',
        ID_Profesional: this.turnoParaEditar.ID_Profesional,
        profesionalCtrl: profesionalObj || '',
        ID_Especialidad: this.turnoParaEditar.ID_Especialidad,
        Fecha: fechaValue,
        Hora: horaValue
      });
      this.form.get('ID_Paciente')?.disable();
      this.form.get('pacienteCtrl')?.disable();
      this.form.get('ID_Profesional')?.disable();
      this.form.get('profesionalCtrl')?.disable();
      this.form.get('ID_Especialidad')?.disable();
    }
  }

  cargarPacientes() {
    this.pacienteService.obtenerPacientes().subscribe({
      next: (data) => {
        this.pacientes = data;
        this.pacientesCargados = true;
        this.intentarPatch();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.snackBar.open('Error al cargar pacientes.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cargarProfesionales() {
    this.turnosService.obtenerProfesionales().subscribe({
      next: (data) => {
        this.profesionales = data;
        this.profesionalesCargados = true;
        this.intentarPatch();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.snackBar.open('Error al cargar profesionales.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cargarEspecialidadesPorProfesional(idProfesional: number) {
    if (!idProfesional) {
      this.especialidadesFiltradas = [];
      this.especialidadesCargadas = true;
      this.intentarPatch();
      return;
    }
    this.turnosService.obtenerEspecialidadesPorProfesional(idProfesional).subscribe(data => {
      this.especialidadesFiltradas = data;
      this.especialidadesCargadas = true;
      this.intentarPatch();
      this.cdr.detectChanges();
    });
  }
}
