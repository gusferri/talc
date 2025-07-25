/**
 * Componente Nuevo Turno - Creación y edición de citas médicas
 * 
 * Este componente proporciona una interfaz completa para crear y editar turnos/citas
 * médicas en el sistema TALC, con validaciones avanzadas y gestión de disponibilidad.
 * 
 * Funcionalidades principales:
 * - Creación de nuevos turnos médicos
 * - Edición de turnos existentes
 * - Validación de disponibilidad en tiempo real
 * - Autocompletado de pacientes y profesionales
 * - Carga dinámica de especialidades por profesional
 * - Filtrado de horarios disponibles
 * - Prevención de conflictos de horarios
 * - Validación de fechas pasadas
 * - Gestión de estados de carga
 * 
 * Responsabilidades:
 * - Gestionar formularios reactivos complejos
 * - Validar disponibilidad de horarios
 * - Cargar datos relacionados (pacientes, profesionales, especialidades)
 * - Manejar modos de creación y edición
 * - Prevenir conflictos de programación
 * - Proporcionar feedback visual al usuario
 * - Gestionar navegación y estados
 * 
 * Arquitectura:
 * - Componente standalone con formularios reactivos
 * - Integración con Material Design
 * - Validaciones en tiempo real
 * - Comunicación con múltiples servicios
 * - Gestión de estados complejos
 */

// Importaciones de Angular Core
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

// Importaciones de Angular Forms
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

// Importaciones de Angular Material
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';

// Importaciones de Angular Router
import { Router, ActivatedRoute } from '@angular/router';

// Importaciones de servicios
import { TurnosService } from '../../services/turnos.service';
import { PacienteService } from '../../services/paciente.service';

// Importaciones de Angular Common
import { CommonModule } from '@angular/common';

// Importaciones de RxJS
import { Observable, startWith, map } from 'rxjs';

/**
 * Componente para creación y edición de turnos médicos
 * Proporciona una interfaz completa para gestionar citas con validaciones avanzadas
 */
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
  /** Formulario reactivo para la gestión de datos del turno */
  form!: FormGroup;
  
  /** Lista de pacientes disponibles */
  pacientes: any[] = [];
  
  /** Lista de profesionales disponibles */
  profesionales: any[] = [];
  
  /** Lista de especialidades disponibles */
  especialidades: any[] = [];
  
  /** Lista de especialidades filtradas por profesional */
  especialidadesFiltradas: any[] = [];
  
  /** Horarios disponibles para turnos */
  horasDisponibles: string[] = [
    '08:00', '09:00', '10:00', '11:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00',
  ];
  
  /** Horarios filtrados según disponibilidad */
  horasFiltradas: string[] = [];
  
  /** Lista de turnos existentes para validación */
  turnos: any[] = [];
  
  /** Estado de carga del componente */
  isLoading = false;
  
  /** Fecha actual para validaciones */
  today: Date = new Date();
  
  /** Observable para autocompletado de pacientes */
  filteredPacientes!: Observable<any[]>;
  
  /** Observable para autocompletado de profesionales */
  filteredProfesionales!: Observable<any[]>;
  
  /** Flag que indica si está en modo edición */
  modoEdicion: boolean = false;
  
  /** ID del turno a editar */
  idTurnoEditar: number | null = null;
  
  /** Flag que indica si los pacientes han sido cargados */
  pacientesCargados = false;
  
  /** Flag que indica si los profesionales han sido cargados */
  profesionalesCargados = false;
  
  /** Flag que indica si las especialidades han sido cargadas */
  especialidadesCargadas = false;
  
  /** Datos del turno que se está editando */
  turnoParaEditar: any = null;
  
  /** Contador de reintentos para patch del formulario */
  private patchRetryCount = 0;
  
  /** Límite máximo de reintentos para patch */
  private readonly patchRetryLimit = 20;
  
  /** Flag que indica si ya se intentó hacer patch */
  private patchIntentado = false;

  /**
   * Constructor del componente
   * Inyecta los servicios necesarios para formularios, turnos, pacientes y navegación
   * 
   * @param fb - Servicio para construcción de formularios reactivos
   * @param turnosService - Servicio para operaciones con turnos
   * @param pacienteService - Servicio para operaciones con pacientes
   * @param snackBar - Servicio para mostrar notificaciones
   * @param router - Servicio para navegación
   * @param cdr - Servicio para detección de cambios
   * @param route - Servicio para acceder a parámetros de ruta
   */
  constructor(
    private fb: FormBuilder,
    private turnosService: TurnosService,
    private pacienteService: PacienteService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  /**
   * Método del ciclo de vida OnInit
   * Se ejecuta cuando el componente se inicializa
   * Configura el formulario, maneja parámetros de ruta y carga datos iniciales
   */
  ngOnInit(): void {
    // Inicialización del formulario reactivo
    this.form = this.fb.group({
      ID_Paciente: [null, Validators.required],
      pacienteCtrl: [''],
      ID_Profesional: [null, Validators.required],
      profesionalCtrl: [''],
      ID_Especialidad: [null, Validators.required],
      Fecha: [null, Validators.required],
      Hora: [null, Validators.required],
    });

    // Manejo de parámetros de ruta para modo edición
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.modoEdicion = true;
        this.idTurnoEditar = +id;
        this.turnosService.obtenerTurnoPorId(+id).subscribe(turno => {
          // Conversión de hora si es necesario
          let horaValue = turno.Hora;
          if (typeof horaValue === 'number') {
            const totalMinutes = Math.floor(horaValue / 60);
            const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
            const m = (totalMinutes % 60).toString().padStart(2, '0');
            horaValue = `${h}:${m}`;
          } else if (typeof horaValue === 'string') {
            horaValue = horaValue.substring(0, 5);
          }
          
          const pacienteObj = this.pacientes.find(p => p.ID === turno.ID_Paciente) || '';
          const profesionalObj = this.profesionales.find(p => p.ID === turno.ID_Profesional) || '';
          
          // Patch del formulario con datos del turno
          this.form.patchValue({
            ID_Paciente: turno.ID_Paciente,
            pacienteCtrl: pacienteObj,
            ID_Profesional: turno.ID_Profesional,
            profesionalCtrl: profesionalObj,
            ID_Especialidad: turno.ID_Especialidad,
            Fecha: this.parsearFecha(turno.Fecha),
            Hora: horaValue
          }, { emitEvent: false });
          
          // Deshabilitar campos en modo edición
          this.form.get('ID_Paciente')?.disable();
          this.form.get('pacienteCtrl')?.disable();
          this.form.get('ID_Profesional')?.disable();
          this.form.get('profesionalCtrl')?.disable();
          this.form.get('ID_Especialidad')?.disable();
          
          this.turnoParaEditar = turno;
          
          // En modo edición, llenar especialidadesFiltradas con la especialidad del turno
          if (this.modoEdicion) {
            this.especialidadesFiltradas = [{
              ID: turno.ID_Especialidad,
              Nombre: turno.Especialidad
            }];
          }
        });
      }
    });

    // Solo para alta, no para edición - suscripción a cambios de profesional
    if (!this.modoEdicion) {
      this.form.get('ID_Profesional')?.valueChanges.subscribe(id => {
        this.cargarEspecialidadesPorProfesional(id);
        this.form.get('ID_Especialidad')?.reset();
      });
    }

    // Carga de datos iniciales
    this.cargarPacientes();
    this.cargarProfesionales();
    this.cargarTurnos();

    // Suscripciones para filtrado de horarios
    this.form.get('Fecha')?.valueChanges.subscribe(() => {
      this.filtrarHorasDisponibles();
    });
    this.form.get('ID_Profesional')?.valueChanges.subscribe(() => {
      this.filtrarHorasDisponibles();
    });
    this.form.get('ID_Paciente')?.valueChanges.subscribe(() => {
      this.filtrarHorasDisponibles();
    });

    // Configuración de autocompletado
    this.filteredPacientes = this.form.get('pacienteCtrl')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPacientes(value || ''))
    );
    this.filteredProfesionales = this.form.get('profesionalCtrl')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterProfesionales(value || ''))
    );
  }

  /**
   * Filtra la lista de pacientes para autocompletado
   * 
   * @param value - Valor de entrada para filtrar
   * @returns Lista filtrada de pacientes
   */
  private _filterPacientes(value: any): any[] {
    let filterValue = '';
    if (typeof value === 'string') {
      filterValue = value.toLowerCase();
    } else if (value && (value.Nombre || value.nombre)) {
      filterValue = (value.Nombre || value.nombre).toLowerCase();
    }
    return this.pacientes.filter(p =>
      (p.Nombre && p.Nombre.toLowerCase().includes(filterValue)) ||
      (p.Apellido && p.Apellido.toLowerCase().includes(filterValue))
    );
  }

  /**
   * Filtra la lista de profesionales para autocompletado
   * 
   * @param value - Valor de entrada para filtrar
   * @returns Lista filtrada de profesionales
   */
  private _filterProfesionales(value: any): any[] {
    let filterValue = '';
    if (typeof value === 'string') {
      filterValue = value.toLowerCase();
    } else if (value && (value.Nombre || value.nombre)) {
      filterValue = (value.Nombre || value.nombre).toLowerCase();
    }
    return this.profesionales.filter(p =>
      (p.nombre && p.nombre.toLowerCase().includes(filterValue)) ||
      (p.apellido && p.apellido.toLowerCase().includes(filterValue))
    );
  }

  /**
   * Maneja la selección de un paciente del autocompletado
   * 
   * @param paciente - Paciente seleccionado
   */
  seleccionarPaciente(paciente: any) {
    this.form.get('ID_Paciente')?.setValue(paciente.ID);
  }

  /**
   * Maneja la selección de un profesional del autocompletado
   * 
   * @param profesional - Profesional seleccionado
   */
  seleccionarProfesional(profesional: any) {
    this.form.get('ID_Profesional')?.setValue(profesional.ID);
  }

  /**
   * Carga todos los turnos existentes para validación de disponibilidad
   */
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

  /**
   * Filtra las horas disponibles según fecha, profesional y paciente seleccionados
   */
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

  /**
   * Verifica si un horario específico está disponible
   * 
   * @param hora - Hora a verificar
   * @param fecha - Fecha a verificar
   * @param _idProfesional - ID del profesional
   * @param _idPaciente - ID del paciente
   * @returns true si el horario está disponible, false en caso contrario
   */
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

    // Buscar turnos conflictivos
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

  /**
   * Formatea una fecha Date a string YYYY-MM-DD
   * 
   * @param date - Fecha a formatear
   * @returns Fecha formateada como string
   */
  formatearFecha(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Función helper para convertir fecha string a Date sin problemas de zona horaria
   * 
   * @param fechaString - Fecha en formato string
   * @returns Fecha como objeto Date
   */
  parsearFecha(fechaString: string): Date {
    if (!fechaString) return new Date();
    // Si la fecha viene en formato YYYY-MM-DD, la parseamos correctamente
    const [year, month, day] = fechaString.split('-').map(Number);
    return new Date(year, month - 1, day); // month - 1 porque los meses en JS van de 0-11
  }

  /**
   * Guarda el turno (crea nuevo o actualiza existente)
   */
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
      // Modo edición
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
      // Modo creación
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

  /**
   * Cancela la operación y navega de vuelta a la lista de turnos
   */
  cancelar() {
    this.router.navigate(['/turnos']);
  }

  /**
   * Función helper para mostrar el nombre del paciente en el autocompletado
   * 
   * @param paciente - Objeto paciente
   * @returns String formateado con nombre y apellido
   */
  displayPaciente(paciente: any): string {
    if (!paciente) return '';
    if (typeof paciente === 'string') return paciente;
    return paciente.Nombre ? `${paciente.Nombre} ${paciente.Apellido || ''}`.trim() : '';
  }

  /**
   * Función helper para mostrar el nombre del profesional en el autocompletado
   * 
   * @param profesional - Objeto profesional
   * @returns String formateado con nombre del profesional
   */
  displayProfesional(profesional: any): string {
    return profesional && profesional.nombre ? profesional.nombre : '';
  }

  /**
   * Getter para el control de paciente
   */
  get pacienteCtrl() {
    return this.form.get('pacienteCtrl') as import('@angular/forms').FormControl;
  }

  /**
   * Getter para el control de profesional
   */
  get profesionalCtrl() {
    return this.form.get('profesionalCtrl') as import('@angular/forms').FormControl;
  }

  /**
   * Verifica si una hora específica está ocupada
   * 
   * @param hora - Hora a verificar
   * @returns true si la hora está ocupada, false en caso contrario
   */
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

  /**
   * Carga la lista de pacientes desde el servicio
   */
  cargarPacientes() {
    this.pacienteService.obtenerPacientes().subscribe({
      next: (data) => {
        this.pacientes = data;
        this.pacientesCargados = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.snackBar.open('Error al cargar pacientes.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Carga la lista de profesionales desde el servicio
   */
  cargarProfesionales() {
    this.turnosService.obtenerProfesionales().subscribe({
      next: (data) => {
        this.profesionales = data;
        
        // En modo edición, configurar el formulario con datos del turno
        if (this.modoEdicion && this.turnoParaEditar) {
          const pacienteObj = this.pacientes.find(p => p.ID === this.turnoParaEditar.ID_Paciente) || '';
          const profesionalObj = this.profesionales.find(p => p.ID === this.turnoParaEditar.ID_Profesional) || '';
          
          let horaValue = this.turnoParaEditar.Hora;
          if (typeof horaValue === 'number') {
            const totalMinutes = Math.floor(horaValue / 60);
            const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
            const m = (totalMinutes % 60).toString().padStart(2, '0');
            horaValue = `${h}:${m}`;
          } else if (typeof horaValue === 'string') {
            horaValue = horaValue.substring(0, 5);
          }
          
          this.form.patchValue({
            ID_Paciente: this.turnoParaEditar.ID_Paciente,
            pacienteCtrl: pacienteObj,
            ID_Profesional: this.turnoParaEditar.ID_Profesional,
            profesionalCtrl: profesionalObj,
            ID_Especialidad: this.turnoParaEditar.ID_Especialidad,
            Fecha: this.parsearFecha(this.turnoParaEditar.Fecha),
            Hora: horaValue
          }, { emitEvent: false });
          
          // Deshabilitar campos en modo edición
          this.form.get('ID_Paciente')?.disable();
          this.form.get('pacienteCtrl')?.disable();
          this.form.get('ID_Profesional')?.disable();
          this.form.get('profesionalCtrl')?.disable();
          this.form.get('ID_Especialidad')?.disable();
          
          // Configurar especialidad
          this.especialidadesFiltradas = [{
            ID: this.turnoParaEditar.ID_Especialidad,
            Nombre: this.turnoParaEditar.Especialidad
          }];
        }
        
        this.profesionalesCargados = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.snackBar.open('Error al cargar profesionales.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Carga las especialidades disponibles para un profesional específico
   * 
   * @param idProfesional - ID del profesional
   */
  cargarEspecialidadesPorProfesional(idProfesional: number) {
    if (!idProfesional) {
      this.especialidadesFiltradas = [];
      this.especialidadesCargadas = true;
      return;
    }
    
    this.turnosService.obtenerEspecialidadesPorProfesional(idProfesional).subscribe(data => {
      this.especialidadesFiltradas = data;
      this.especialidadesCargadas = true;
      
      // Patch directo al terminar de cargar especialidades en modo edición
      if (this.modoEdicion && this.turnoParaEditar) {
        const idEspecialidad = this.turnoParaEditar.ID_Especialidad;
        const especialidadExiste = this.especialidadesFiltradas.some(e => e.ID === idEspecialidad);
        
        if (!especialidadExiste) {
          console.warn(`⚠️ La especialidad con ID ${idEspecialidad} no está entre las especialidades cargadas para el profesional.`);
          console.warn('🧪 Especialidades disponibles:', this.especialidadesFiltradas);
        }
        
        this.form.patchValue({
          ID_Paciente: this.turnoParaEditar.ID_Paciente,
          pacienteCtrl: this.pacientes.find(p => p.ID === this.turnoParaEditar.ID_Paciente) || '',
          ID_Profesional: this.turnoParaEditar.ID_Profesional,
          profesionalCtrl: this.profesionales.find(p => p.ID === this.turnoParaEditar.ID_Profesional) || '',
          ID_Especialidad: idEspecialidad,
          Fecha: this.parsearFecha(this.turnoParaEditar.Fecha),
          Hora: (this.turnoParaEditar.Hora || '').substring(0,5)
        });
        
        // Deshabilitar campos en modo edición
        this.form.get('ID_Paciente')?.disable();
        this.form.get('pacienteCtrl')?.disable();
        this.form.get('ID_Profesional')?.disable();
        this.form.get('profesionalCtrl')?.disable();
        this.form.get('ID_Especialidad')?.disable();
      }
      
      this.cdr.detectChanges();
    });
  }
}
