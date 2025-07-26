// Importaciones necesarias para el componente Dashboard
// Component: Decorador que define la clase como un componente Angular
// OnInit: Interfaz que permite ejecutar código al inicializar el componente
// ViewEncapsulation: Controla cómo se encapsulan los estilos del componente
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
// Router: Servicio para la navegación entre rutas de la aplicación
import { Router } from '@angular/router';
// CommonModule: Proporciona directivas comunes como *ngIf, *ngFor, etc.
import { CommonModule } from '@angular/common';
// MaterialModule: Módulo personalizado que agrupa todos los componentes de Material Design
import { MaterialModule } from 'src/app/material.module';
// Servicios para obtener datos de pacientes y turnos desde el backend
import { PacienteService } from '../../services/paciente.service';
import { TurnosService } from '../../services/turnos.service';
import { AuthService } from '../../services/auth.service'; // Nuevo servicio para verificar roles

/**
 * Interfaz que define la estructura de una tarjeta de estadísticas
 * Utilizada para mostrar métricas importantes en el dashboard
 */
export interface StatCard {
  title: string;      // Título de la estadística (ej: "Pacientes", "Turnos Hoy")
  value: number;      // Valor numérico de la estadística
  icon: string;       // Nombre del icono de Material Design
  color: string;      // Color hexadecimal para el icono
  route: string;      // Ruta a la que navegar al hacer clic en la tarjeta
}

/**
 * Interfaz que define la estructura de una acción rápida
 * Utilizada para mostrar botones de acceso directo a funcionalidades principales
 */
export interface QuickAction {
  title: string;        // Título de la acción (ej: "Nuevo Paciente")
  description: string;  // Descripción detallada de la acción
  icon: string;         // Nombre del icono de Material Design
  color: string;        // Color hexadecimal para el icono
  route: string;        // Ruta a la que navegar al hacer clic
}

/**
 * Componente Dashboard - Panel principal de control del sistema TALC
 * 
 * Funcionalidades principales:
 * - Muestra estadísticas generales (pacientes, turnos de hoy, turnos pendientes)
 * - Proporciona acceso rápido a las funcionalidades más utilizadas
 * - Lista los turnos programados para el día actual
 * - Adapta la información según el rol del usuario (secretaria o profesional)
 * 
 * Responsabilidades:
 * - Cargar y mostrar datos estadísticos en tiempo real
 * - Facilitar la navegación a otras secciones del sistema
 * - Proporcionar una vista general del estado actual del sistema
 */
@Component({
  selector: 'app-dashboard',                    // Selector CSS para usar el componente
  templateUrl: './dashboard.component.html',    // Template HTML del componente
  imports: [MaterialModule, CommonModule],      // Módulos importados para este componente
  styleUrls: ['./dashboard.component.scss'],    // Archivo de estilos específico
  encapsulation: ViewEncapsulation.None        // Permite que los estilos afecten componentes hijos
})
export class DashboardComponent implements OnInit {
  // Flag para controlar el estado de carga de datos
  isLoading = true;
  // Nombre del usuario logueado, obtenido del localStorage
  nombreUsuario = '';
  // Fecha actual para mostrar en el dashboard
  currentDate = new Date();
  
  /**
   * Array de estadísticas que se muestran en tarjetas
   * Cada elemento representa una métrica importante del sistema
   */
  stats: StatCard[] = [
    {
      title: 'Pacientes',
      value: 0,                    // Se actualiza dinámicamente según el rol del usuario
      icon: 'people',              // Icono de personas
      color: '#2196f3',            // Azul
      route: '/pacientes'          // Navega a la sección de pacientes
    },
    {
      title: 'Turnos Hoy',
      value: 0,                    // Se calcula dinámicamente según la fecha actual
      icon: 'event',               // Icono de calendario
      color: '#ff9800',            // Naranja
      route: '/turnos'             // Navega a la sección de turnos
    },
    {
      title: 'Turnos Pendientes',
      value: 0,                    // Turnos de hoy que aún no han pasado
      icon: 'schedule',            // Icono de reloj
      color: '#f44336',            // Rojo
      route: '/turnos'             // Navega a la sección de turnos
    }
  ];

  /**
   * Array de acciones rápidas para acceso directo a funcionalidades principales
   * Permite al usuario realizar tareas comunes sin navegar por el menú
   */
  quickActions: QuickAction[] = [
    {
      title: 'Nuevo Paciente',
      description: 'Registrar un nuevo paciente en el sistema',
      icon: 'person_add',          // Icono de agregar persona
      color: '#4caf50',            // Verde
      route: '/pacientes/nuevo'    // Navega al formulario de nuevo paciente
    },
    {
      title: 'Nuevo Turno',
      description: 'Programar una nueva cita o turno',
      icon: 'event_available',     // Icono de calendario disponible
      color: '#ff9800',            // Naranja
      route: '/turnos/nuevo'       // Navega al formulario de nuevo turno
    },
    {
      title: 'Ver Agenda',
      description: 'Consultar la agenda de turnos',
      icon: 'calendar_today',      // Icono de calendario actual
      color: '#2196f3',            // Azul
      route: '/turnos'             // Navega a la vista de turnos
    }
  ];

  // Array que almacena los turnos programados para el día actual
  turnosHoy: any[] = [];

  /**
   * Constructor del componente
   * Inyecta los servicios necesarios para obtener datos y navegación
   */
  constructor(
    private router: Router,                    // Servicio para navegación entre rutas
    private pacienteService: PacienteService,  // Servicio para operaciones con pacientes
    private turnosService: TurnosService,       // Servicio para operaciones con turnos
    private authService: AuthService          // Servicio para verificar roles
  ) {}

  /**
   * Método del ciclo de vida OnInit
   * Se ejecuta cuando el componente se inicializa
   * Responsable de cargar los datos iniciales del dashboard
   */
  ngOnInit(): void {
    this.cargarDatos();                        // Carga las estadísticas y datos del dashboard
    this.nombreUsuario = localStorage.getItem('nombreCompleto') || 'Usuaria';  // Obtiene el nombre del usuario logueado
  }

  /**
   * Método principal para cargar todos los datos del dashboard
   * Adapta la información mostrada según el rol del usuario:
   * - Secretaria: Ve todos los pacientes y turnos
   * - Profesional: Ve solo sus pacientes y turnos
   */
  cargarDatos(): void {
    this.isLoading = true;  // Activa el indicador de carga
    
    // Obtiene el nombre de usuario (shortname) para identificar al profesional
    const shortname = localStorage.getItem('username');
    
    // Verificar si es secretaria usando el servicio centralizado
    const esSecretaria = this.authService.esSecretaria();
    
    // Lógica para cargar pacientes según el rol del usuario
    if (esSecretaria) {
      // Las secretarias pueden ver todos los pacientes del sistema
      this.pacienteService.obtenerPacientes().subscribe({
        next: (pacientes: any[]) => {
          this.stats[0].value = pacientes.length;  // Actualiza el contador de pacientes
          this.isLoading = false;                   // Desactiva el indicador de carga
        },
        error: (error: any) => {
          console.error('Error al cargar pacientes:', error);
          this.stats[0].value = 0;  // En caso de error, establece el valor en 0
          this.isLoading = false;
        }
      });
    } else if (shortname) {
      // Los profesionales solo ven sus propios pacientes
      this.pacienteService.obtenerPacientesPorProfesional(shortname).subscribe({
        next: (pacientes: any[]) => {
          this.stats[0].value = pacientes.length;  // Actualiza el contador de pacientes del profesional
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error al cargar pacientes del profesional:', error);
          this.stats[0].value = 0;
          this.isLoading = false;
        }
      });
    } else {
      // Si no hay rol o shortname, establece el valor en 0
      this.stats[0].value = 0;
      this.isLoading = false;
    }

    // Carga los turnos para calcular estadísticas de turnos de hoy y pendientes
    this.turnosService.obtenerTurnos().subscribe({
      next: (data: any[]) => {
        // Normaliza el nombre del profesional para comparaciones consistentes
        const nombreProfesional = this.normalizarTexto(localStorage.getItem('nombreCompleto') || '');
        
        // Obtiene la fecha actual en formato YYYY-MM-DD para comparar con las fechas de los turnos
        const hoy = new Date();
        const hoyStr = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
        console.log('Hoy (local):', hoyStr);
        
        // Log para debugging: muestra todas las fechas de turnos recibidas
        console.log('Fechas de todos los turnos:', data.map(t => t.Fecha));
        
        // Obtiene la hora actual para determinar turnos pendientes
        const ahora = new Date();
        const horaActual = ahora.toTimeString().slice(0,5); // Formato HH:mm
        
        // Estados considerados como "pendientes" para el cálculo
        const estadosPendientes = ['agendado', 'pendiente', 'confirmado'];

        let turnosHoy: any[] = [];
        
        // Filtra los turnos según el rol del usuario
        if (esSecretaria) {
          // Las secretarias ven todos los turnos de hoy de todas las profesionales
          turnosHoy = data.filter((turno: any) => turno.Fecha && turno.Fecha.substring(0, 10) === hoyStr);
        } else {
          // Los profesionales solo ven sus propios turnos de hoy
          turnosHoy = data.filter((turno: any) => 
            turno.Fecha && turno.Fecha.substring(0, 10) === hoyStr &&
            turno.Profesional && this.normalizarTexto(turno.Profesional) === nombreProfesional
          );
        }
        
        // Log para debugging: muestra las fechas de los turnos que pasan el filtro
        console.log('Fechas de turnos que pasan el filtro hoy:', turnosHoy.map(t => t.Fecha));

        // Calcula los turnos pendientes: turnos de hoy cuya hora es mayor a la actual y estado válido
        const turnosPendientes = turnosHoy.filter((turno: any) => {
          return (
            turno.Hora && turno.Hora > horaActual &&
            turno.Estado && estadosPendientes.includes((turno.Estado || '').toLowerCase())
          );
        });

        // Actualiza las estadísticas con los valores calculados
        this.stats[1].value = turnosHoy.length;        // Total de turnos de hoy
        this.stats[2].value = turnosPendientes.length; // Turnos pendientes
        this.turnosHoy = turnosHoy;                    // Almacena los turnos para mostrar en la lista
      },
      error: (error: any) => {
        console.error('Error al cargar turnos:', error);
      }
    });
  }

  /**
   * Normaliza un texto para comparaciones consistentes
   * Convierte a minúsculas, quita tildes y normaliza espacios
   * Útil para comparar nombres de profesionales sin problemas de acentos o mayúsculas
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
   * Método para navegar a una ruta específica
   * Utilizado por las tarjetas de estadísticas y acciones rápidas
   * 
   * @param route - Ruta a la que navegar
   */
  navegarA(route: string): void {
    this.router.navigate([route]);
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
    return hora.substring(0, 5); // Toma solo los primeros 5 caracteres (HH:MM)
  }

  /**
   * Determina el color de fondo para el badge de estado de un turno
   * Asigna colores específicos según el estado para facilitar la identificación visual
   * 
   * @param estado - Estado del turno (confirmado, pendiente, cancelado, etc.)
   * @returns Color hexadecimal para el badge de estado
   */
  getEstadoColor(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmado':
        return '#4caf50';    // Verde para turnos confirmados
      case 'pendiente':
        return '#ff9800';    // Naranja para turnos pendientes
      case 'cancelado':
        return '#f44336';    // Rojo para turnos cancelados
      case 'completado':
        return '#2196f3';    // Azul para turnos completados
      default:
        return '#757575';    // Gris para estados no definidos
    }
  }
}
