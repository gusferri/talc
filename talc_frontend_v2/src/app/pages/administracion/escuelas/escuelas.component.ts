/**
 * Componente Escuelas - Gestión de escuelas del sistema TALC
 * 
 * Este componente permite gestionar las escuelas del sistema,
 * incluyendo la visualización, creación, edición y eliminación de escuelas.
 * Solo accesible para usuarios con rol de administrador.
 * 
 * Funcionalidades principales:
 * - Listar todas las escuelas del sistema con ciudad y provincia
 * - Crear nuevas escuelas
 * - Editar escuelas existentes
 * - Eliminar escuelas (marcar como inactivas)
 * - Filtrado y búsqueda de escuelas
 * 
 * Responsabilidades:
 * - Verificar permisos de administrador
 * - Gestionar el estado de carga y errores
 * - Proporcionar interfaz para CRUD de escuelas
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
import { AdminService, Escuela } from '../../../services/admin.service';

// Importaciones de componentes
import { EscuelaDialogComponent } from './escuela-dialog/escuela-dialog.component';

/**
 * Interfaz para los datos de la tabla de escuelas
 */
interface EscuelaTableItem extends Escuela {
  acciones?: any; // Para las columnas de acciones
}

/**
 * Componente principal de gestión de escuelas
 */
@Component({
  selector: 'app-escuelas',
  templateUrl: './escuelas.component.html',
  styleUrls: ['./escuelas.component.scss'],
  imports: [CommonModule, MaterialModule, FormsModule],
  standalone: true
})
export class EscuelasComponent implements OnInit, AfterViewInit {
  // Referencias a componentes de Material
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Configuración de la tabla
  displayedColumns: string[] = ['ID', 'Nombre', 'Ciudad', 'Provincia', 'acciones'];
  dataSource = new MatTableDataSource<EscuelaTableItem>([]);

  // Estado del componente
  isLoading = true;
  errorMessage = '';

  // Filtros
  filtroNombre = '';

  // Datos originales para filtrado
  datosOriginales: EscuelaTableItem[] = [];

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

    // Cargar las escuelas
    this.cargarEscuelas();
  }

  /**
   * Método que se ejecuta después de inicializar las vistas
   */
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Carga las escuelas desde el backend
   */
  cargarEscuelas(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminService.obtenerEscuelas().subscribe({
      next: (escuelas: Escuela[]) => {
        console.log('🏫 Escuelas cargadas:', escuelas);
        
        // Convertir a formato de tabla
        const escuelasTable = escuelas.map(escuela => ({
          ...escuela,
          acciones: null // Placeholder para las acciones
        }));

        this.datosOriginales = [...escuelasTable];
        this.dataSource.data = escuelasTable;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar escuelas:', error);
        this.errorMessage = 'Error al cargar las escuelas';
        this.isLoading = false;
      }
    });
  }

  /**
   * Abre el diálogo para crear una nueva escuela
   */
  abrirDialogoNuevaEscuela(): void {
    const dialogRef = this.dialog.open(EscuelaDialogComponent, {
      width: '600px',
      disableClose: false,
      data: { modo: 'crear' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🏫 Nueva escuela creada:', result);
        this.mostrarNotificacion('Escuela creada exitosamente', 'success');
        this.cargarEscuelas(); // Recargar datos
      }
    });
  }

  /**
   * Abre el diálogo para editar una escuela existente
   */
  abrirDialogoEditarEscuela(escuela: Escuela): void {
    const dialogRef = this.dialog.open(EscuelaDialogComponent, {
      width: '600px',
      disableClose: false,
      data: { 
        modo: 'editar',
        escuela: escuela
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🏫 Escuela editada:', result);
        this.mostrarNotificacion('Escuela actualizada exitosamente', 'success');
        this.cargarEscuelas(); // Recargar datos
      }
    });
  }

  /**
   * Elimina una escuela (marca como inactiva)
   */
  eliminarEscuela(escuela: Escuela): void {
    if (confirm(`¿Está seguro que desea eliminar la escuela "${escuela.Nombre}"?`)) {
      this.adminService.eliminarEscuela(escuela.ID).subscribe({
        next: () => {
          console.log('🏫 Escuela eliminada:', escuela.ID);
          this.mostrarNotificacion('Escuela eliminada exitosamente', 'success');
          this.cargarEscuelas(); // Recargar datos
        },
        error: (error) => {
          console.error('❌ Error al eliminar escuela:', error);
          this.mostrarNotificacion('Error al eliminar la escuela', 'error');
        }
      });
    }
  }

  /**
   * Aplica filtros a la tabla
   */
  aplicarFiltros(): void {
    let datosFiltrados = [...this.datosOriginales];

    // Filtro por nombre
    if (this.filtroNombre.trim()) {
      const filtro = this.filtroNombre.toLowerCase().trim();
      datosFiltrados = datosFiltrados.filter(escuela =>
        escuela.Nombre.toLowerCase().includes(filtro) ||
        (escuela.Ciudad && escuela.Ciudad.toLowerCase().includes(filtro)) ||
        (escuela.Provincia && escuela.Provincia.toLowerCase().includes(filtro))
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