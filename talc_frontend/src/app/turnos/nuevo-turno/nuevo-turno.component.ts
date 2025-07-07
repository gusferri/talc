import { Component, OnInit, inject, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions, DateSelectArg } from '@fullcalendar/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CustomSnackbarComponent } from '../../shared/custom-snackbar/custom-snackbar.component';
import { MatCardModule } from '@angular/material/card';


@Component({
  selector: 'app-nuevo-turno',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FullCalendarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule,
    MatCardModule // <-- nuevo
  ],
  templateUrl: './nuevo-turno.component.html',
  styleUrls: ['./nuevo-turno.component.css'],
  encapsulation: ViewEncapsulation.None // Permite que los estilos afecten elementos de Angular Material
})

// Componente para la creación de nuevos turnos
// Este componente permite seleccionar un paciente, profesional, especialidad y hora para agendar un turno
// Utiliza Angular Reactive Forms para la gestión de formularios y FullCalendar para la selección de fechas
// Se conecta a un backend para cargar datos de pacientes, profesionales y turnos existentes
// Además, verifica la disponibilidad de horarios y muestra un calendario interactivo
export class NuevoTurnoComponent implements OnInit {
  public turnoID: string | null = null;
  // Horas disponibles para seleccionar en el formulario
  horasDisponibles: string[] = [
    '08:00', '09:00', '10:00', '11:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00',
  ];
  // Formulario reactivo para la creación de turnos
  // Contiene campos para seleccionar paciente, profesional, especialidad y hora
  // Se valida que todos los campos sean obligatorios antes de enviar el formulario
  // Se utiliza el FormBuilder de Angular para crear el formulario y gestionar su estado
  form!: FormGroup;
  // Variables para almacenar datos de pacientes, profesionales y especialidades
  // Se cargan desde el backend al iniciar el componente
  // Se utilizan para mostrar opciones en el formulario y verificar disponibilidad de turnos
  pacientes: any[] = [];
  profesionales: any[] = [];
  especialidadesFiltradas: any[] = [];
  // Turnos existentes cargados desde el backend
  turnos: any[] = [];
  // Variable para almacenar la fecha seleccionada en el calendario
  fechaSeleccionada: string = '';
  // Variable para habilitar o deshabilitar el botón de guardar turno
  // Se deshabilita si el formulario no es válido o si no hay fecha seleccionada
  // Se utiliza para evitar que el usuario envíe un formulario incompleto
  botonDeshabilitado = true;
  // Configuración del calendario FullCalendar
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    locale: 'es',
    //hiddenDays: [0, 6],
    initialView: 'dayGridMonth',
    initialDate: new Date(),
    height: 451,
    selectable: true,
    unselectAuto: false,
    select: this.onDateSelect.bind(this),
    validRange: {
      start: new Date().toLocaleDateString('sv-SE')
    },
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    },
    buttonText: {
      today: 'Hoy'
    },
    dateClick: (arg) => {
      this.onDateSelect({ startStr: arg.dateStr } as DateSelectArg);
    },
    events: []
  };

  // Inyección de dependencias para el FormBuilder, HttpClient y ChangeDetectorRef
  // Se utilizan para crear el formulario, realizar peticiones HTTP y forzar la detección de cambios en la vista
  // Se inyectan en el constructor del componente para su uso posterior
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  idPacienteDesdeURL: number | null = null;
  idProfesionalDesdeURL: number | null = null;
  idEspecialidadDesdeURL: number | null = null;

  // Método que se ejecuta al iniciar el componente. Configura el formulario, carga los datos y registra eventos reactivos.
  // Se utiliza el ciclo de vida OnInit para inicializar el componente y cargar datos necesarios
  // Se configura el formulario reactivo con los campos necesarios y sus validaciones
  ngOnInit(): void {
    console.log('🌐 URL actual:', window.location.href);
    this.turnoID = new URLSearchParams(window.location.search).get('turnoID');
    const turnoID = this.turnoID;
    console.log('🔎 turnoID recibido en la URL:', turnoID);
    this.form = this.fb.group({
      ID_Paciente: [null, Validators.required],
      ID_Profesional: [null, Validators.required],
      ID_Especialidad: [null, Validators.required],
      Hora: [null, Validators.required],
    });

    if (turnoID) {
      this.http.get<any>(`http://192.168.2.41:8000/turnos/${turnoID}`).subscribe(turno => {
        console.log('📦 Datos cargados del turno para edición:', turno);
        this.form.patchValue({
          ID_Paciente: turno.ID_Paciente,
          ID_Profesional: turno.ID_Profesional,
          ID_Especialidad: turno.ID_Especialidad,
          Hora: turno.Hora
        });
        this.form.get('ID_Paciente')?.disable();
        this.form.get('ID_Profesional')?.disable();
        this.form.get('ID_Especialidad')?.disable();
        this.fechaSeleccionada = turno.Fecha;
    
        // 🔁 Ahora cargamos los turnos una vez tenemos la info de este turno y actualizamos las horas ocupadas
        this.cargarTurnos(() => {
          // Excluir el turno actual de los turnos para validación (ya se hace en verificarDisponibilidad)
          this.actualizarHorasOcupadas();
        });
        this.cargarEspecialidadesPorProfesional(turno.ID_Profesional);
      });
    } else {
      this.cargarTurnos();
    }
    
    // Se configuran los campos del formulario como obligatorios
    this.cargarPacientes();
    this.cargarProfesionales();

    // Se actualizan las especialidades disponibles al seleccionar un profesional
    this.form.get('ID_Profesional')?.valueChanges.subscribe((idProfesional) => {
      this.form.get('ID_Especialidad')?.reset();
      if (idProfesional) {
        this.cargarEspecialidadesPorProfesional(idProfesional);
      } else {
        this.especialidadesFiltradas = [];
      }
    });

    // Se actualizan las horas ocupadas y el calendario al seleccionar un paciente
    this.form.get('ID_Paciente')?.valueChanges.subscribe((idPaciente) => {
      this.actualizarHorasOcupadas();

      if (idPaciente) {
        this.actualizarEventosDelPaciente(idPaciente);
      } else {
        this.calendarOptions.events = [];
      }
    });

    // Se actualizan las horas ocupadas al seleccionar un profesional
    this.form.get('ID_Profesional')?.valueChanges.subscribe(() => {
      this.actualizarHorasOcupadas();
    });

    // Se deshabilita el botón de guardar turno si el formulario no es válido
    this.form.statusChanges.subscribe(status => {
      this.botonDeshabilitado = status !== 'VALID';
    });

    // Seleccionar la fecha de hoy al iniciar
    setTimeout(() => {
      const hoy = new Date();
      const hoyStr = hoy.toISOString().split('T')[0];
      this.onDateSelect({ startStr: hoyStr } as DateSelectArg);
    }, 0);
  }

  // Cargar pacientes desde el backend
  cargarPacientes() {
    this.http.get<any[]>('http://192.168.2.41:8000/turnos/pacientes').subscribe(data => {
      console.log('PACIENTES:', data);
      this.pacientes = data;
      if (this.idPacienteDesdeURL) {
        this.form.get('ID_Paciente')?.setValue(this.idPacienteDesdeURL);
      }
    });
  }

  // Cargar profesionales desde el backend
  cargarProfesionales() {
    this.http.get<any[]>('http://192.168.2.41:8000/turnos/profesionales').subscribe(data => {
      console.log('PROFESIONALES:', data);
      this.profesionales = data;
      if (this.idProfesionalDesdeURL) {
        this.form.get('ID_Profesional')?.setValue(this.idProfesionalDesdeURL);
      }
    });
  }

  // Cargar todos los turnos existentes desde el backend
  cargarTurnos(callback?: () => void) {
    this.http.get<any[]>('http://192.168.2.41:8000/turnos/todos').subscribe(data => {
      this.turnos = data;
      console.log('📅 TURNOS CARGADOS DESDE BACKEND:', this.turnos); // Log de ayuda para ver qué datos devuelve la API
      this.cdr.detectChanges(); // Forzar actualización de la vista
      if (callback) callback();
    });
  }

  // Cargar especialidades filtradas por profesional seleccionado
  cargarEspecialidadesPorProfesional(idProfesional: number) {
    this.http.get<any[]>(`http://192.168.2.41:8000/turnos/especialidades-por-profesional/${idProfesional}`).subscribe(data => {
      this.especialidadesFiltradas = data;
      if (this.idEspecialidadDesdeURL) {
        this.form.get('ID_Especialidad')?.setValue(this.idEspecialidadDesdeURL);
        this.idEspecialidadDesdeURL = null; // limpiar después de usar
      } else if (data.length > 0) {
        this.form.get('ID_Especialidad')?.setValue(data[0].ID);
      }
    });
  }

  // Método que se ejecuta al seleccionar una fecha en el calendario
  // Se utiliza el plugin de interacción de FullCalendar para manejar la selección de fechas
  // Se obtiene la fecha seleccionada y se formatea para su uso en el formulario
  onDateSelect(selectInfo: DateSelectArg) {
    const selectedDate = new Date(selectInfo.startStr);
    // Guardar la fecha seleccionada
    this.fechaSeleccionada = selectedDate.toISOString().split('T')[0];

    // Buscar la primera hora disponible automáticamente
    const ahora = new Date();
    const primeraHoraDisponible = this.horasDisponibles.find(hora => {
      const [horaStr, minutosStr] = hora.split(':');
      const horaSeleccionada = new Date(`${this.fechaSeleccionada}T${horaStr}:${minutosStr}:00`);

      // Si la fecha seleccionada es hoy y la hora ya pasó, descartarla
      const hoyStr = ahora.toISOString().split('T')[0];
      if (this.fechaSeleccionada === hoyStr && ahora > horaSeleccionada) {
        return false;
      }

      return this.verificarDisponibilidad(hora);
    });

    // Establecer la primera hora disponible en el formulario si existe
    this.form.get('Hora')?.setValue(primeraHoraDisponible ?? null);

    // Forzar actualización visual
    this.actualizarHorasOcupadas();
  }

  // Verifica si un turno está ocupado por el mismo paciente o profesional en la fecha y hora seleccionadas
  verificarDisponibilidad(hora: string): boolean {
    const raw = this.form.getRawValue();
    const profesionalID = raw.ID_Profesional;
    const pacienteID = raw.ID_Paciente;
    if (!profesionalID || !pacienteID || !this.fechaSeleccionada) {
      return true; // si falta info, consideramos que está disponible
    }
    // Validar si la hora ya pasó (solo si es hoy)
    const fechaHoyStr = new Date().toISOString().split('T')[0];
    if (this.fechaSeleccionada === fechaHoyStr) {
      const [horaStr, minutosStr] = hora.split(':');
      const ahora = new Date();
      const horaComparar = new Date(`${this.fechaSeleccionada}T${horaStr}:${minutosStr}:00`);
      if (ahora > horaComparar) {
        return false; // La hora ya pasó
      }
    }

    const coincidencias = this.turnos.filter(turno => {
      if ([3, 5].includes(turno.ID_EstadoTurno)) return false;
      if (this.turnoID && turno.ID?.toString() === this.turnoID?.toString()) return false; // Ignorar el turno que se está editando
      const horaTurno = turno.Hora?.toString().substring(0, 5);
      const horaSeleccionada = hora.toString().substring(0, 5);
      return (
        (turno.ID_Paciente?.toString() === pacienteID.toString() || turno.ID_Profesional?.toString() === profesionalID.toString()) &&
        turno.Fecha === this.fechaSeleccionada &&
        horaTurno === horaSeleccionada
      );
    });

    console.log('⏱️ Verificando disponibilidad:', {
      fechaSeleccionada: this.fechaSeleccionada,
      hora,
      pacienteID,
      profesionalID,
      coincidencias
    });

    return coincidencias.length === 0;
  }

  // Devuelve true si la hora está ocupada según la verificación previa
  estaOcupado(hora: string): boolean {
    const ocupado = !this.verificarDisponibilidad(hora);
    console.log(`🔍 Hora ${hora} está ocupada: ${ocupado}`);
    return ocupado;
  }

  // Fuerza una actualización visual para que los botones de hora se habiliten o deshabiliten según corresponda
  actualizarHorasOcupadas() {
    const horaActual = this.form.get('Hora')?.value;
    this.form.get('Hora')?.setValue(null); // Destriggerea renderizado
    setTimeout(() => {
      this.form.get('Hora')?.setValue(horaActual);
    }, 0);
  }

  // Actualiza los eventos del calendario para mostrar los turnos del paciente seleccionado
  private actualizarEventosDelPaciente(idPaciente: number) {
    const eventos = this.turnos
      .filter(t => t.ID_Paciente === idPaciente && ![3].includes(t.ID_EstadoTurno)) // Excluir cancelados y finalizados
      .map(t => {
        const profesional = this.profesionales.find(p => p.ID === t.ID_Profesional);
        return {
          title: `Turno con ${profesional ? profesional.nombre : 'Profesional'}`,
          start: `${t.Fecha}T${t.Hora}`,
          allDay: false
        };
      });

    this.calendarOptions.events = eventos;
    this.cdr.detectChanges();
  }

  // Valida el formulario y envía los datos del nuevo turno al backend si todo es correcto
  guardarTurno() {
    console.log('Datos del formulario:', this.form.value);
    console.log('Formulario válido:', this.form.valid);
    
      if (this.form.invalid) {
      console.warn('Formulario inválido. Controles con error:', this.form.controls);
      this.snackBar.openFromComponent(CustomSnackbarComponent, {
        data: { message: 'Por favor completá todos los campos requeridos.' },
        duration: 3000,
        panelClass: 'custom-snackbar',
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }
    const fecha = this.fechaSeleccionada;
    const hora = this.form.value.Hora;
    console.log('🔍 Validando disponibilidad para:', this.form.get('Hora')?.value);
    if (!this.verificarDisponibilidad(this.form.get('Hora')?.value)) {
      this.snackBar.openFromComponent(CustomSnackbarComponent, {
        data: { message: '⚠️ El horario seleccionado ya está ocupado por el paciente o el profesional.' },
        duration: 3000,
        panelClass: 'custom-snackbar',
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    const fechaHora = `${fecha} ${hora}`;
    console.log('🧪 FechaHora formateada para insertar:', fechaHora);
    const raw = this.form.getRawValue();
    const nuevoTurno = {
      ID_Paciente: raw.ID_Paciente,
      ID_Profesional: raw.ID_Profesional,
      ID_Especialidad: raw.ID_Especialidad,
      Fecha: fecha,
      Hora: hora,
      ID_EstadoTurno: 1 // Agendado por defecto
    };

    if (this.turnoID) {
      this.http.put(`http://192.168.2.41:8000/turnos/${this.turnoID}`, nuevoTurno).subscribe({
        next: response => {
          console.log('Turno actualizado:', response);
          this.snackBar.openFromComponent(CustomSnackbarComponent, {
            data: { message: '✅ Turno actualizado con éxito' },
            duration: 3000,
            panelClass: 'custom-snackbar',
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          window.location.href = '/turnos/calendario';
        },
        error: err => {
          console.error('Error al actualizar el turno:', err);
          this.snackBar.openFromComponent(CustomSnackbarComponent, {
            data: { message: '❌ Error al actualizar el turno. Verificá los datos e intentá nuevamente.' },
            duration: 3000,
            panelClass: 'custom-snackbar',
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      });
    } else {
      this.http.post('http://192.168.2.41:8000/turnos', nuevoTurno).subscribe({
        next: response => {
          console.log('Turno creado:', response);
          this.snackBar.openFromComponent(CustomSnackbarComponent, {
            data: { message: '✅ Turno guardado con éxito' },
            duration: 3000,
            panelClass: 'custom-snackbar',
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.form.reset();
          window.location.href = '/turnos/calendario';
        },
        error: err => {
          console.error('Error al guardar el turno:', err);
          this.snackBar.openFromComponent(CustomSnackbarComponent, {
            data: { message: '❌ Error al guardar el turno. Verificá los datos e intentá nuevamente.' },
            duration: 3000,
            panelClass: 'custom-snackbar',
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      });
    }
  }
  volverAlCalendario() {
    window.location.href = '/turnos/calendario';
  }
}