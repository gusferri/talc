/**
 * Componente Administración - Panel de gestión administrativa del sistema TALC
 * 
 * Este componente proporciona acceso a todas las funcionalidades administrativas
 * del sistema, incluyendo la gestión de profesionales, usuarios, obras sociales
 * y escuelas. Solo es accesible para usuarios con rol de administrador.
 * 
 * Funcionalidades principales:
 * - Gestión de Profesionales (ABM completo)
 * - Gestión de Usuarios del sistema (ABM con roles)
 * - Gestión de Obras Sociales (ABM)
 * - Gestión de Escuelas (ABM)
 * 
 * Responsabilidades:
 * - Verificar permisos de administrador
 * - Proporcionar navegación a submódulos administrativos
 * - Mostrar estadísticas administrativas
 * - Facilitar el acceso a funcionalidades críticas del sistema
 */

// Importaciones de Angular Core
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';

// Importaciones de servicios
import { AuthService } from '../../services/auth.service';
import { AdminService, EstadisticasSistema } from '../../services/admin.service';

/**
 * Interfaz que define la estructura de un módulo administrativo
 * Utilizada para mostrar las diferentes secciones de administración
 */
export interface AdminModule {
  title: string;        // Título del módulo (ej: "Profesionales")
  description: string;  // Descripción detallada del módulo
  icon: string;         // Nombre del icono de Material Design
  color: string;        // Color hexadecimal para el icono
  route: string;        // Ruta a la que navegar al hacer clic
  count?: number;       // Contador opcional de elementos en el módulo
}

/**
 * Interfaz que define la estructura de una estadística administrativa
 * Utilizada para mostrar métricas importantes del sistema
 */
export interface AdminStat {
  title: string;      // Título de la estadística
  value: number;      // Valor numérico de la estadística
  icon: string;       // Nombre del icono de Material Design
  color: string;      // Color hexadecimal para el icono
  description: string; // Descripción adicional
}

/**
 * Componente principal de Administración
 * Solo accesible para usuarios con rol de administrador
 */
@Component({
  selector: 'app-administracion',
  templateUrl: './administracion.component.html',
  imports: [MaterialModule, CommonModule],
  styleUrls: ['./administracion.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AdministracionComponent implements OnInit {
  // Flag para controlar el estado de carga
  isLoading = true;
  
  // Nombre del usuario logueado
  nombreUsuario = '';
  
  // Fecha actual
  currentDate = new Date();

  /**
   * Array de módulos administrativos disponibles
   * Cada elemento representa una sección de administración
   */
  adminModules: AdminModule[] = [
    {
      title: 'Profesionales',
      description: 'Gestionar profesionales del sistema, especialidades y configuraciones',
      icon: 'medical_services',
      color: '#2196f3',
      route: '/administracion/profesionales'
    },
    {
      title: 'Usuarios',
      description: 'Administrar usuarios del sistema, roles y permisos',
      icon: 'people',
      color: '#ff9800',
      route: '/administracion/usuarios'
    },
    {
      title: 'Obras Sociales',
      description: 'Gestionar obras sociales y coberturas médicas',
      icon: 'health_and_safety',
      color: '#4caf50',
      route: '/administracion/obras-sociales'
    },
    {
      title: 'Escuelas',
      description: 'Administrar escuelas y instituciones educativas',
      icon: 'school',
      color: '#9c27b0',
      route: '/administracion/escuelas'
    },
    {
      title: 'Especialidades',
      description: 'Gestionar especialidades médicas y terapéuticas',
      icon: 'psychology',
      color: '#e91e63',
      route: '/administracion/especialidades'
    }
  ];

  /**
   * Array de estadísticas administrativas
   * Muestra métricas importantes del sistema
   */
  adminStats: AdminStat[] = [
    {
      title: 'Total Profesionales',
      value: 0,
      icon: 'medical_services',
      color: '#2196f3',
      description: 'Profesionales activos en el sistema'
    },
    {
      title: 'Usuarios Activos',
      value: 0,
      icon: 'people',
      color: '#ff9800',
      description: 'Usuarios con acceso al sistema'
    },
    {
      title: 'Obras Sociales',
      value: 0,
      icon: 'health_and_safety',
      color: '#4caf50',
      description: 'Obras sociales registradas'
    },
    {
      title: 'Escuelas',
      value: 0,
      icon: 'school',
      color: '#9c27b0',
      description: 'Instituciones educativas'
    },
    {
      title: 'Especialidades',
      value: 0,
      icon: 'psychology',
      color: '#e91e63',
      description: 'Especialidades médicas disponibles'
    }
  ];

  /**
   * Constructor del componente
   * Inyecta los servicios necesarios para la funcionalidad
   */
  constructor(
    private router: Router,
    private authService: AuthService,
    private adminService: AdminService
  ) {}

  /**
   * Método que se ejecuta al inicializar el componente
   * Verifica permisos y carga datos iniciales
   */
  ngOnInit(): void {
    // Verificar que el usuario tenga permisos de administrador
    if (!this.authService.esAdministrador()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Cargar datos del usuario
    this.cargarDatosUsuario();
    
    // Cargar estadísticas administrativas
    this.cargarEstadisticas();
  }

  /**
   * Carga los datos del usuario logueado
   * Obtiene el nombre desde localStorage
   */
  cargarDatosUsuario(): void {
    const nombreCompleto = localStorage.getItem('nombreCompleto');
    this.nombreUsuario = nombreCompleto || 'Administrador';
  }

  /**
   * Carga las estadísticas del sistema desde el backend
   */
  cargarEstadisticas(): void {
    console.log('🔍 Iniciando carga de estadísticas...');
    this.adminService.obtenerEstadisticas().subscribe({
      next: (stats) => {
        console.log('✅ Estadísticas recibidas:', stats);
        
        // Actualizar valores de estadísticas
        this.adminStats[0].value = stats.total_profesionales;
        this.adminStats[1].value = stats.total_usuarios;
        this.adminStats[2].value = stats.total_obras_sociales;
        this.adminStats[3].value = stats.total_escuelas;
        this.adminStats[4].value = stats.total_especialidades;
        
        // Actualizar contadores en módulos
        this.adminModules[0].count = stats.total_profesionales;
        this.adminModules[1].count = stats.total_usuarios;
        this.adminModules[2].count = stats.total_obras_sociales;
        this.adminModules[3].count = stats.total_escuelas;
        this.adminModules[4].count = stats.total_especialidades;
        
        // Marcar como cargado
        this.isLoading = false;
        console.log('✅ Carga de estadísticas completada');
      },
      error: (error) => {
        console.error('❌ Error al cargar estadísticas:', error);
        console.error('❌ Detalles del error:', error.error);
        // Marcar como cargado incluso si hay error
        this.isLoading = false;
      }
    });
  }

  /**
   * Navega a la ruta especificada
   * @param route - Ruta a la que navegar
   */
  navegarA(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Formatea una fecha para mostrar en formato legible
   * @param fecha - Fecha a formatear
   * @returns Fecha formateada
   */
  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
} 