// Importaciones necesarias para la configuración de rutas
// Routes: Tipo de Angular Router que define la estructura de navegación
import { Routes } from '@angular/router';

// Importaciones de componentes principales (carga estática)
// Estos componentes se cargan inmediatamente al iniciar la aplicación
import { DashboardComponent } from './dashboard/dashboard.component';
import { PacientesComponent } from './pacientes/pacientes.component';
import { TurnosComponent } from './turnos/turnos.component';
import { NuevoPacienteComponent } from './pacientes/nuevo-paciente/nuevo-paciente.component';
import { DetallePacienteComponent } from './pacientes/detalle-paciente/detalle-paciente.component';
import { NuevoTurnoComponent } from './turnos/nuevo-turno.component';
import { ReportesComponent } from './turnos/reportes.component';
import { CalendarioComponent } from './turnos/calendario.component';

// Importación del guard de administración
import { AdminGuard } from '../guards/admin.guard';

/**
 * Configuración de rutas principales del sistema TALC
 * 
 * Este archivo define toda la estructura de navegación de la aplicación,
 * incluyendo rutas para dashboard, gestión de pacientes y turnos.
 * 
 * Características principales:
 * - Rutas con carga estática (componentes principales)
 * - Rutas con carga lazy (componentes secundarios para optimizar rendimiento)
 * - Breadcrumbs automáticos para navegación
 * - Títulos dinámicos para cada página
 * 
 * Estructura de navegación:
 * - Dashboard: Panel principal de control
 * - Pacientes: Gestión completa de pacientes
 * - Turnos: Gestión de citas y agenda
 */
export const PagesRoutes: Routes = [
  /**
   * Ruta raíz: Redirige al dashboard
   * Es la página principal que se muestra al acceder a la aplicación
   */
  {
    path: '',                    // Ruta raíz (sin path)
    component: DashboardComponent,
    data: {
      title: 'Dashboard',        // Título de la página
      urls: [                    // Breadcrumbs para navegación
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Dashboard' },  // Elemento actual (sin URL)
      ],
    },
  },
  
  /**
   * Ruta explícita del dashboard
   * Muestra el panel principal de control del sistema
   */
  {
    path: 'dashboard',
    component: DashboardComponent,
    data: {
      title: 'Dashboard',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Dashboard' },
      ],
    },
  },
  
  /**
   * Gestión de Pacientes: Lista principal de pacientes
   * Permite ver, buscar y gestionar todos los pacientes del sistema
   */
  {
    path: 'pacientes',
    component: PacientesComponent,
    data: {
      title: 'Gestión de Pacientes',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Pacientes' },
      ],
    },
  },
  
  /**
   * Nuevo Paciente: Formulario para registrar un nuevo paciente
   * Permite ingresar toda la información personal y médica del paciente
   */
  {
    path: 'pacientes/nuevo',
    component: NuevoPacienteComponent,
    data: {
      title: 'Nuevo Paciente',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Pacientes', url: '/pacientes' },
        { title: 'Nuevo Paciente' },
      ],
    },
  },
  
  /**
   * Notas de Voz por Paciente: Gestión de notas de voz
   * Carga lazy para optimizar el rendimiento inicial de la aplicación
   * Permite grabar y gestionar notas de voz asociadas a pacientes
   */
  {
    path: 'pacientes/notasvoz',
    loadComponent: () => import('./pacientes/notas-voz-por-paciente/notas-voz-por-paciente.component').then(m => m.NotasVozPorPacienteComponent),
    data: {
      title: 'Notas de Voz por Paciente',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Pacientes', url: '/pacientes' },
        { title: 'Notas de Voz' }
      ],
    },
  },
  
  /**
   * Seguimiento Evolutivo: Historial médico del paciente
   * Carga lazy para optimizar el rendimiento
   * Permite registrar y consultar el seguimiento evolutivo de cada paciente
   */
  {
    path: 'pacientes/seguimiento-evolutivo',
    loadComponent: () => import('./pacientes/seguimiento-evolutivo-por-paciente/seguimiento-evolutivo-por-paciente.component')
      .then(m => m.SeguimientoEvolutivoPorPacienteComponent),
    data: {
      title: 'Seguimiento Evolutivo por Paciente',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Pacientes', url: '/pacientes' },
        { title: 'Seguimiento Evolutivo' }
      ],
    },
  },
  
  /**
   * Detalle de Paciente: Vista detallada de un paciente específico
   * Utiliza parámetro dinámico :id para mostrar información del paciente seleccionado
   */
  {
    path: 'pacientes/:id',       // :id es un parámetro dinámico
    component: DetallePacienteComponent,
    data: {
      title: 'Detalle Paciente',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Pacientes', url: '/pacientes' },
        { title: 'Detalle Paciente' },
      ],
    },
  },
  
  /**
   * Gestión de Turnos: Lista principal de turnos
   * Permite ver, buscar, crear y gestionar todos los turnos del sistema
   */
  {
    path: 'turnos',
    component: TurnosComponent,
    data: {
      title: 'Gestión de Turnos',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Turnos' },
      ],
    },
  },
  
  /**
   * Nuevo Turno: Formulario para crear una nueva cita
   * Permite seleccionar paciente, profesional, fecha y hora para el turno
   */
  {
    path: 'turnos/nuevo',
    component: NuevoTurnoComponent,
    data: {
      title: 'Nuevo Turno',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Turnos', url: '/turnos' },
        { title: 'Nuevo Turno' },
      ],
    },
  },
  
  /**
   * Editar Turno: Formulario para modificar un turno existente
   * Utiliza el mismo componente que Nuevo Turno pero en modo edición
   * El parámetro :id identifica qué turno editar
   */
  {
    path: 'turnos/editar/:id',   // :id identifica el turno a editar
    component: NuevoTurnoComponent,  // Mismo componente que nuevo turno
    data: {
      title: 'Editar Turno',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Turnos', url: '/turnos' },
        { title: 'Editar Turno' }
      ],
    },
  },
  
  /**
   * Reportes de Turnos: Generación de reportes y estadísticas
   * Permite generar reportes de turnos por diferentes criterios
   */
  {
    path: 'turnos/reportes',
    component: ReportesComponent,
    data: {
      title: 'Reportes de Turnos',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Turnos', url: '/turnos' },
        { title: 'Reportes' }
      ],
    },
  },
  
  /**
   * Calendario de Turnos: Vista de calendario para turnos
   * Carga lazy para optimizar el rendimiento
   * Muestra los turnos en formato de calendario mensual
   */
  {
    path: 'turnos/calendario',
    loadComponent: () => import('./turnos/calendario.component').then(m => m.CalendarioComponent),
    data: {
      title: 'Calendario de Turnos',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Turnos', url: '/turnos' },
        { title: 'Calendario' }
      ],
    },
  },
  
  /**
   * Administración: Panel de gestión administrativa del sistema
   * Solo accesible para usuarios con rol de administrador
   * Permite gestionar profesionales, usuarios, obras sociales y escuelas
   */
  {
    path: 'administracion',
    loadComponent: () => import('./administracion/administracion.component').then(m => m.AdministracionComponent),
    data: {
      title: 'Administración',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Administración' }
      ],
    },
    canActivate: [AdminGuard], // Proteger la ruta con el guard
  },

  /**
   * Obras Sociales: Gestión de obras sociales del sistema
   * Solo accesible para usuarios con rol de administrador
   * Permite crear, editar y eliminar obras sociales
   */
  {
    path: 'administracion/obras-sociales',
    loadComponent: () => import('./administracion/obras-sociales/obras-sociales.component').then(m => m.ObrasSocialesComponent),
    data: {
      title: 'Gestión de Obras Sociales',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Administración', url: '/administracion' },
        { title: 'Obras Sociales' }
      ],
    },
    canActivate: [AdminGuard], // Proteger la ruta con el guard
  },

  /**
   * Escuelas: Gestión de escuelas del sistema
   * Solo accesible para usuarios con rol de administrador
   * Permite crear, editar y eliminar escuelas con información de ciudad y provincia
   */
      {
      path: 'administracion/escuelas',
      loadComponent: () => import('./administracion/escuelas/escuelas.component').then(m => m.EscuelasComponent),
      data: {
        title: 'Gestión de Escuelas',
        urls: [
          { title: 'Dashboard', url: '/dashboard' },
          { title: 'Administración', url: '/administracion' },
          { title: 'Escuelas' }
        ],
      },
      canActivate: [AdminGuard], // Proteger la ruta con el guard
    },
    {
      path: 'administracion/profesionales',
      loadComponent: () => import('./administracion/profesionales/profesionales.component').then(m => m.ProfesionalesComponent),
      data: {
        title: 'Gestión de Profesionales',
        urls: [
          { title: 'Dashboard', url: '/dashboard' },
          { title: 'Administración', url: '/administracion' },
          { title: 'Profesionales' }
        ],
      },
      canActivate: [AdminGuard], // Proteger la ruta con el guard
    },

    /**
     * Usuarios: Gestión de usuarios del sistema
     * Solo accesible para usuarios con rol de administrador
     * Permite crear, editar y gestionar usuarios del sistema
     */
    {
      path: 'administracion/usuarios',
      loadComponent: () => import('./administracion/usuarios/usuarios.component').then(m => m.UsuariosComponent),
      data: {
        title: 'Gestión de Usuarios',
        urls: [
          { title: 'Dashboard', url: '/dashboard' },
          { title: 'Administración', url: '/administracion' },
          { title: 'Usuarios' }
        ],
      },
      canActivate: [AdminGuard], // Proteger la ruta con el guard
    },

  /**
   * Especialidades: Gestión de especialidades médicas del sistema
   * Solo accesible para usuarios con rol de administrador
   * Permite crear, editar y gestionar especialidades médicas
   */
  {
    path: 'administracion/especialidades',
    loadComponent: () => import('./administracion/especialidades/especialidades.component').then(m => m.EspecialidadesComponent),
    data: {
      title: 'Gestión de Especialidades',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Administración', url: '/administracion' },
        { title: 'Especialidades' }
      ],
    },
    canActivate: [AdminGuard], // Proteger la ruta con el guard
  },

  /**
   * Auditoría: Registro de cambios y acciones del sistema
   * Solo accesible para usuarios con rol de administrador
   * Permite consultar el historial de cambios realizados en el sistema
   */
  {
    path: 'administracion/auditoria',
    loadComponent: () => import('./administracion/auditoria/auditoria.component').then(m => m.AuditoriaComponent),
    data: {
      title: 'Auditoría del Sistema',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Administración', url: '/administracion' },
        { title: 'Auditoría' }
      ],
    },
    canActivate: [AdminGuard], // Proteger la ruta con el guard
  },
];
