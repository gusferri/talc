/**
 * Componente Turnos - Gestión principal de turnos/citas del sistema TALC
 * 
 * Este componente es el núcleo central para la gestión de citas médicas en el sistema,
 * proporcionando una interfaz completa para administrar turnos según el rol del usuario
 * (secretaria o profesional) y el estado de las citas.
 * 
 * Funcionalidades principales:
 * - Lista todos los turnos del sistema (secretarias) o turnos del profesional (profesionales)
 * - Filtrado por fecha (hoy, semana, todos) y búsqueda por texto
 * - Ordenamiento por diferentes columnas
 * - Gestión de estados de turnos (agendado, confirmado, cancelado, ausente, asistido)
 * - Registro de asistencia a turnos
 * - Navegación a funcionalidades específicas de cada turno
 * - Actualización automática de estados (marca como ausente turnos pasados)
 * - Control de acceso basado en roles
 * - Paginación y ordenamiento optimizados
 * 
 * Responsabilidades:
 * - Cargar y mostrar la lista de turnos según el rol del usuario
 * - Proporcionar interfaz para búsqueda, filtrado y ordenamiento
 * - Gestionar el ciclo de vida de los turnos (estados)
 * - Facilitar la navegación a otras funcionalidades relacionadas con turnos
 * - Gestionar la paginación y ordenamiento de la tabla
 * - Implementar control de acceso granular por roles
 * - Mantener consistencia en la presentación de datos médicos
 * 
 * Arquitectura:
 * - Componente standalone con inyección de dependencias
 * - Integración con Material Design para UI consistente
 * - Manejo reactivo de estados y eventos
 * - Comunicación con servicios especializados
 * - Gestión automática de estados de turnos
 */

// Importaciones necesarias para el componente Turnos
// Component: Decorador que define la clase como un componente Angular
// OnInit: Interfaz para ejecutar código al inicializar el componente
// ViewChild: Decorador para acceder a elementos del template
// AfterViewInit: Interfaz para ejecutar código después de que se inicialice la vista
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';

// Router: Servicio para la navegación entre rutas de la aplicación
import { Router } from '@angular/router';

// CommonModule: Proporciona directivas comunes como *ngIf, *ngFor, etc.
import { CommonModule } from '@angular/common';

// Servicio para operaciones con turnos
import { TurnosService } from '../../services/turnos.service';

// Modelo de datos para turnos
import { Turno } from '../../models/turno.model';

// Importaciones de Material Design para la tabla y funcionalidades
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';

// Importaciones de Material Design para UI components
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';

// FormsModule: Para formularios template-driven
import { FormsModule } from '@angular/forms';

// MatSnackBar: Para mostrar notificaciones
import { MatSnackBar } from '@angular/material/snack-bar';

// ActivatedRoute: Para acceder a parámetros de la ruta
import { ActivatedRoute } from '@angular/router';

// Servicio para la autenticación y verificación de roles
import { AuthService } from '../../services/auth.service';

/**
 * Componente principal para gestión de turnos médicos
 * Proporciona una interfaz completa para administrar citas según el rol del usuario
 */
@Component({
  standalone: true,                           // Componente standalone (no necesita módulo)
  selector: 'app-turnos',                     // Selector CSS para usar el componente
  templateUrl: './turnos.component.html',     // Template HTML del componente
  styleUrls: ['./turnos.component.scss'],     // Archivo de estilos específico
  imports: [                                  // Módulos importados para este componente
    CommonModule, 
    MatTableModule, 
    MatPaginatorModule, 
    MatSortModule, 
    MatIconModule, 
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    FormsModule
  ],
})
export class TurnosComponent implements OnInit, AfterViewInit {
  /** DataSource de Material Table para manejar los datos de la tabla */
  turnos: MatTableDataSource<Turno> = new MatTableDataSource<Turno>();
  
  /** Columnas que se muestran en la tabla de turnos */
  displayedColumns: string[] = ['paciente', 'profesional', 'especialidad', 'fecha', 'hora', 'estado', 'acciones'];
  
  /** Término de búsqueda para filtrar turnos */
  searchTerm: string = '';
  
  /** Flag para controlar el estado de carga de datos */
  isLoading: boolean = false;
  
  /** Filtro de fecha actual: hoy, semana, o todos los turnos */
  filtroFecha: 'hoy' | 'semana' | 'todos' = 'hoy';
  
  /** Array que mantiene una copia de los datos originales para filtrado */
  datosOriginales: any[] = [];

  /** Referencias a elementos del template para paginación y ordenamiento */
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  /**
   * Constructor del componente
   * Inyecta los servicios necesarios para navegación, gestión de turnos y notificaciones
   * 
   * @param router - Servicio para navegación entre rutas
   * @param turnosService - Servicio para operaciones con turnos
   * @param snackBar - Servicio para mostrar notificaciones
   * @param route - Servicio para acceder a parámetros de ruta
   */
  constructor(
    private router: Router,                    // Servicio para navegación entre rutas
    private turnosService: TurnosService,      // Servicio para operaciones con turnos
    private snackBar: MatSnackBar,             // Servicio para mostrar notificaciones
    private route: ActivatedRoute,             // Servicio para acceder a parámetros de ruta
    private authService: AuthService           // Servicio para autenticación y roles
  ) {}

  /**
   * Método del ciclo de vida OnInit
   * Se ejecuta cuando el componente se inicializa
   * Responsable de cargar los turnos y manejar parámetros de la ruta
   */
  ngOnInit(): void {
    // Suscribe a los parámetros de consulta de la ruta
    this.route.queryParams.subscribe(params => {
      if (params['paciente']) {
        // Si viene un parámetro de paciente, lo usa como término de búsqueda
        this.searchTerm = params['paciente'];
        this.filtroFecha = 'todos'; // Selecciona el filtro 'Todos' para mostrar todos los turnos
        setTimeout(() => {
          // Aplica el filtro después de un pequeño delay para asegurar que los datos estén cargados
          this.aplicarFiltro({ target: { value: this.searchTerm } } as any);
        });
      }
    });
    this.cargarTurnos();  // Carga los turnos iniciales
  }

  /**
   * Método del ciclo de vida AfterViewInit
   * Se ejecuta después de que se inicialice la vista
   * Configura el paginador y ordenamiento de la tabla
   */
  ngAfterViewInit(): void {
    this.turnos.paginator = this.paginator;  // Asigna el paginador a la tabla
    this.turnos.sort = this.sort;            // Asigna el ordenamiento a la tabla
  }

  /**
   * Carga los turnos desde el backend y aplica filtros según el rol del usuario
   * También actualiza automáticamente el estado de turnos pasados
   * 
   * Este método implementa control de acceso granular y gestión automática de estados
   */
  cargarTurnos(): void {
    this.isLoading = true;  // Activa el indicador de carga
    
    const nombreProfesional = (localStorage.getItem('nombreCompleto') || '');  // Obtiene el nombre del profesional
    
    // Verificar si es secretaria usando el servicio centralizado
    const esSecretaria = this.authService.esSecretaria();
    
    this.turnosService.obtenerTurnos().subscribe({
      next: (data: Turno[]) => {
        let turnosFiltrados = data;
        
        // Filtra turnos según el rol del usuario
        if (!esSecretaria) {
          // Los profesionales solo ven sus propios turnos
          turnosFiltrados = data.filter(turno =>
            turno.Profesional &&
            this.normalizarTexto(turno.Profesional) === this.normalizarTexto(nombreProfesional)
          );
        }
        
        // Marca como ausente los turnos pasados sin asistencia/cancelación/ausente
        const ahora = new Date();
        turnosFiltrados.forEach(turno => {
          const fechaHoraFin = new Date(`${turno.Fecha}T${turno.Hora}`);
          if (
            fechaHoraFin < ahora &&
            turno.Estado !== 'Cancelado' &&
            turno.Estado !== 'Ausente' &&
            turno.Estado !== 'Asistido'
          ) {
            // Actualiza automáticamente el estado a 'Ausente' para turnos pasados
            this.turnosService.actualizarEstadoTurno(turno.ID, 4).subscribe({
              next: () => {
                turno.Estado = 'Ausente';
              }
            });
          }
        });
        this.datosOriginales = [...turnosFiltrados];
        this.filtrarTurnos();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al obtener turnos:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Normaliza un texto para comparaciones consistentes
   * Convierte a minúsculas, quita tildes y normaliza espacios
   * Útil para comparar nombres sin problemas de acentos o mayúsculas
   * 
   * @param texto - Texto a normalizar
   * @returns Texto normalizado para comparaciones
   */
  normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()                                    // Convierte a minúsculas
      .normalize('NFD')                                 // Normaliza caracteres Unicode
      .replace(/[\u0300-\u036f]/g, '')                 // Quita tildes y diacríticos
      .replace(/\s+/g, ' ')                             // Espacios múltiples a uno solo
      .trim();                                          // Elimina espacios al inicio y final
  }

  /**
   * Navega al formulario para crear un nuevo turno
   * Redirige al usuario al formulario de creación de citas
   */
  nuevoTurno(): void {
    this.router.navigate(['/turnos/nuevo']);
  }

  /**
   * Navega al formulario para editar un turno existente
   * Utiliza el ID del turno para la navegación
   * 
   * @param turno - Turno a editar
   */
  editarTurno(turno: Turno): void {
    this.router.navigate(['/turnos/editar', turno.ID]);
  }

  /**
   * Navega a la vista de detalle de un turno específico
   * Permite ver información completa de la cita
   * 
   * @param turno - Turno para ver detalles
   */
  verDetalleTurno(turno: Turno): void {
    this.router.navigate(['/turnos/detalle', turno.ID]);
  }

  /**
   * Cambia el estado de un turno específico
   * Permite actualizar el estado entre: agendado, confirmado, cancelado, etc.
   * 
   * @param turno - Turno cuyo estado se va a cambiar
   * @param nuevoEstado - Nuevo estado del turno (número)
   */
  cambiarEstadoTurno(turno: Turno, nuevoEstado: number): void {
    this.turnosService.actualizarEstadoTurno(turno.ID, nuevoEstado).subscribe({
      next: () => {
        this.cargarTurnos(); // Recarga la tabla para mostrar los cambios
        this.snackBar.open('Turno cancelado correctamente', 'Cerrar', { duration: 2500 });
      },
      error: (error) => {
        console.error('Error al actualizar estado del turno:', error);
        this.snackBar.open('Error al cancelar el turno', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Registra la asistencia de un paciente a un turno
   * Marca el turno como asistido cuando el paciente acude a la cita
   * 
   * @param turno - Turno para registrar asistencia
   */
  registrarAsistencia(turno: Turno): void {
    this.turnosService.registrarAsistencia(turno.ID).subscribe({
      next: () => {
        // Recarga los turnos después de registrar asistencia para actualizar la vista
        this.cargarTurnos();
      },
      error: (error) => {
        console.error('Error al registrar asistencia:', error);
      }
    });
  }

  /**
   * Aplica un filtro de búsqueda a la tabla de turnos
   * Filtra por cualquier campo de texto y resetea la paginación
   * 
   * @param event - Evento del input de búsqueda
   */
  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;  // Obtiene el valor del input
    this.turnos.filter = filterValue.trim().toLowerCase();         // Aplica el filtro

    // Resetea la paginación a la primera página
    if (this.turnos.paginator) {
      this.turnos.paginator.firstPage();
    }
  }

  /**
   * Determina el color de fondo para el badge de estado de un turno
   * Asigna colores específicos según el estado para facilitar la identificación visual
   * 
   * @param estado - Estado del turno (confirmado, pendiente, cancelado, etc.)
   * @returns Color de Material Design para el badge de estado
   */
  getEstadoColor(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmado':
        return 'primary';    // Color primario para turnos confirmados
      case 'pendiente':
        return 'warn';       // Color de advertencia para turnos pendientes
      case 'cancelado':
        return 'accent';     // Color de acento para turnos cancelados
      case 'completado':
        return 'primary';    // Color primario para turnos completados
      default:
        return 'primary';    // Color primario por defecto
    }
  }

  /**
   * Determina el icono para el estado de un turno
   * Asigna iconos específicos según el estado para facilitar la identificación visual
   * 
   * @param estado - Estado del turno (confirmado, pendiente, cancelado, etc.)
   * @returns Nombre del icono de Material Design
   */
  getEstadoIcon(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmado':
        return 'check_circle';   // Icono de check para confirmado
      case 'pendiente':
        return 'schedule';       // Icono de reloj para pendiente
      case 'cancelado':
        return 'cancel';         // Icono de cancelar para cancelado
      case 'completado':
        return 'done_all';       // Icono de completado para completado
      default:
        return 'event';          // Icono de evento por defecto
    }
  }

  /**
   * Formatea una fecha en formato YYYY-MM-DD a DD/MM/YYYY
   * Utilizado para mostrar fechas en formato legible en la interfaz
   * 
   * @param fecha - Fecha en formato YYYY-MM-DD
   * @returns Fecha formateada como DD/MM/YYYY
   */
  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Formatea una hora para mostrar solo HH:MM
   * Elimina segundos y milisegundos si están presentes
   * 
   * @param hora - Hora en formato HH:MM:SS o HH:MM
   * @returns Hora formateada como HH:MM
   */
  formatearHora(hora: string): string {
    if (!hora) return '';
    return hora.substring(0, 5); // Muestra solo HH:MM
  }

  /**
   * Getter que verifica si la ruta actual es de turnos
   * Útil para mostrar/ocultar elementos según la sección actual
   * 
   * @returns true si la ruta actual es de turnos
   */
  get esRutaTurnos(): boolean {
    return this.router.url.startsWith('/turnos');
  }

  /**
   * Getter que verifica si la ruta actual es de pacientes
   * Útil para mostrar/ocultar elementos según la sección actual
   * 
   * @returns true si la ruta actual es de pacientes
   */
  get esRutaPacientes(): boolean {
    return this.router.url.startsWith('/pacientes');
  }

  /**
   * Establece el filtro de fecha y aplica el filtrado
   * Permite filtrar turnos por: hoy, semana, o todos
   * 
   * @param filtro - Tipo de filtro de fecha a aplicar
   */
  setFiltroFecha(filtro: 'hoy' | 'semana' | 'todos') {
    this.filtroFecha = filtro;  // Actualiza el filtro seleccionado
    this.filtrarTurnos();       // Aplica el filtro
  }

  /**
   * Filtra los turnos según el filtro de fecha seleccionado
   * Excluye turnos cancelados y ordena por fecha y hora
   * 
   * Este método implementa lógica de filtrado inteligente para diferentes períodos
   */
  filtrarTurnos() {
    let turnosFiltrados = [...this.datosOriginales];  // Copia los datos originales
    
    // Excluye turnos cancelados de la vista
    turnosFiltrados = turnosFiltrados.filter(t => t.Estado?.toLowerCase() !== 'cancelado');
    
    const hoy = new Date();
    const hoyStr = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
    
    if (this.filtroFecha === 'hoy') {
      // Filtra solo turnos de hoy
      turnosFiltrados = turnosFiltrados.filter(t => t.Fecha && t.Fecha.substring(0, 10) === hoyStr);
    } else if (this.filtroFecha === 'semana') {
      // Filtra turnos de la semana actual (domingo a sábado)
      const diaSemana = hoy.getDay(); // 0=domingo, 6=sábado
      const primerDia = new Date(hoy);
      primerDia.setDate(hoy.getDate() - diaSemana); // domingo
      const ultimoDia = new Date(primerDia);
      ultimoDia.setDate(primerDia.getDate() + 6); // sábado
      turnosFiltrados = turnosFiltrados.filter(t => {
        const fechaTurno = new Date(t.Fecha);
        return fechaTurno >= primerDia && fechaTurno <= ultimoDia;
      });
    }
    
    // Ordena de más antiguo a más reciente por fecha y hora
    turnosFiltrados.sort((a, b) => new Date(a.Fecha + 'T' + a.Hora).getTime() - new Date(b.Fecha + 'T' + b.Hora).getTime());
    this.turnos.data = turnosFiltrados;  // Actualiza la tabla con los datos filtrados
  }

  /**
   * Determina si se puede registrar asistencia para un turno
   * Solo permite registrar asistencia en turnos agendados dentro de una ventana de tiempo específica
   * 
   * @param turno - Turno para verificar si se puede registrar asistencia
   * @returns true si se puede registrar asistencia, false en caso contrario
   */
  puedeRegistrarAsistencia(turno: Turno): boolean {
    if (!turno || turno.Estado?.toLowerCase() !== 'agendado' || !turno.Fecha || !turno.Hora) return false;
    
    const ahora = new Date();
    const fechaHoraTurno = new Date(`${turno.Fecha}T${turno.Hora}`);
    const diffMs = fechaHoraTurno.getTime() - ahora.getTime();
    const diffMin = diffMs / 60000;  // Convierte a minutos
    
    // Se puede registrar desde 30 minutos antes hasta 45 minutos después del turno
    return diffMin <= 45 && diffMin >= -30;
  }
} 