/**
 * Componente Profesionales - Gestión de profesionales del sistema TALC
 * 
 * Este componente permite gestionar los profesionales del sistema,
 * incluyendo la visualización, creación, edición y eliminación de profesionales.
 * Solo accesible para usuarios con rol de administrador.
 * 
 * Funcionalidades principales:
 * - Listar todos los profesionales del sistema con ciudad y provincia
 * - Crear nuevos profesionales
 * - Editar profesionales existentes
 * - Eliminar profesionales (marcar como inactivos)
 * - Filtrado y búsqueda de profesionales
 * 
 * Responsabilidades:
 * - Verificar permisos de administrador
 * - Gestionar el estado de carga y errores
 * - Proporcionar interfaz para CRUD de profesionales
 * - Manejar notificaciones de éxito/error
 */

import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

// Importaciones de servicios
import { AuthService } from '../../../services/auth.service';
import { AdminService, Profesional } from '../../../services/admin.service';

// Importaciones de componentes
import { ProfesionalDialogComponent } from './profesional-dialog/profesional-dialog.component';

/**
 * Interfaz para los datos de la tabla de profesionales
 */
interface ProfesionalTableItem extends Profesional {
  acciones?: any; // Para las columnas de acciones
}

/**
 * Componente principal de gestión de profesionales
 */
@Component({
  selector: 'app-profesionales',
  templateUrl: './profesionales.component.html',
  styleUrls: ['./profesionales.component.scss'],
  imports: [CommonModule, MaterialModule, FormsModule],
  standalone: true
})
export class ProfesionalesComponent implements OnInit, AfterViewInit {
  // Referencias a componentes de Material
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Configuración de la tabla
  displayedColumns: string[] = ['DNI', 'Nombre', 'Apellido', 'Especialidad', 'Estado', 'acciones'];
  dataSource = new MatTableDataSource<ProfesionalTableItem>([]);

  // Estado del componente
  isLoading = true;
  errorMessage = '';

  // Filtros
  filtroNombre = '';

  // Datos originales para filtrado
  datosOriginales: ProfesionalTableItem[] = [];

  /**
   * Constructor del componente
   */
  constructor(
    private router: Router,
    private authService: AuthService,
    private adminService: AdminService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Método que se ejecuta al inicializar el componente
   */
  ngOnInit(): void {
    // Verificar que el usuario tenga permisos de administrador
    if (!this.authService.esAdministrador()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Cargar los profesionales
    this.cargarProfesionales();
  }

  /**
   * Método que se ejecuta después de inicializar las vistas
   */
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Carga los profesionales desde el backend
   */
  cargarProfesionales(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminService.obtenerProfesionales().subscribe({
      next: (profesionales: Profesional[]) => {
        console.log('👨‍⚕️ Profesionales cargados:', profesionales);
        
        // Convertir a formato de tabla
        const profesionalesTable = profesionales.map(profesional => ({
          ...profesional,
          acciones: null // Placeholder para las acciones
        }));

        this.datosOriginales = [...profesionalesTable];
        this.dataSource.data = profesionalesTable;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar profesionales:', error);
        this.errorMessage = 'Error al cargar los profesionales';
        this.isLoading = false;
      }
    });
  }

  /**
   * Abre el diálogo para crear un nuevo profesional
   */
  abrirDialogoNuevoProfesional(): void {
    const dialogRef = this.dialog.open(ProfesionalDialogComponent, {
      width: '700px',
      disableClose: false,
      data: { modo: 'crear' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('👨‍⚕️ Nuevo profesional creado:', result);
        this.mostrarNotificacion('Profesional creado exitosamente', 'success');
        this.cargarProfesionales(); // Recargar datos
      }
    });
  }

  /**
   * Abre el diálogo para editar un profesional existente
   */
  abrirDialogoEditarProfesional(profesional: Profesional): void {
    const dialogRef = this.dialog.open(ProfesionalDialogComponent, {
      width: '700px',
      disableClose: false,
      data: { 
        modo: 'editar',
        profesional: profesional
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('👨‍⚕️ Profesional editado:', result);
        this.mostrarNotificacion('Profesional actualizado exitosamente', 'success');
        this.cargarProfesionales(); // Recargar datos
      }
    });
  }

  /**
   * Aplica filtros a la tabla
   */
  aplicarFiltros(): void {
    let datosFiltrados = [...this.datosOriginales];

    // Filtro por nombre o apellido
    if (this.filtroNombre.trim()) {
      const filtro = this.filtroNombre.toLowerCase().trim();
      datosFiltrados = datosFiltrados.filter(profesional =>
        profesional.Nombre.toLowerCase().includes(filtro) ||
        profesional.Apellido.toLowerCase().includes(filtro)
      );
    }

    this.dataSource.data = datosFiltrados;
    
    // Resetear paginación
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.dataSource.data = [...this.datosOriginales];
    
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  /**
   * Muestra una notificación
   */
  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: tipo === 'success' ? ['success-snackbar'] : ['error-snackbar']
    });
  }

  /**
   * Navega de vuelta al dashboard de administración
   */
  volverAAdministracion(): void {
    this.router.navigate(['/administracion']);
  }
} 