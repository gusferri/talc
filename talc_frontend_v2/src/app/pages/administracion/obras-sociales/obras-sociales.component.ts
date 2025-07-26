/**
 * Componente Obras Sociales - Gestión de obras sociales del sistema TALC
 * 
 * Este componente permite gestionar las obras sociales del sistema,
 * incluyendo la visualización, creación, edición y eliminación de obras sociales.
 * Solo accesible para usuarios con rol de administrador.
 * 
 * Funcionalidades principales:
 * - Listar todas las obras sociales del sistema
 * - Crear nuevas obras sociales
 * - Editar obras sociales existentes
 * - Eliminar obras sociales (marcar como inactivas)
 * - Filtrado y búsqueda de obras sociales
 * 
 * Responsabilidades:
 * - Verificar permisos de administrador
 * - Gestionar el estado de carga y errores
 * - Proporcionar interfaz para CRUD de obras sociales
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
import { AdminService, ObraSocial } from '../../../services/admin.service';

// Importaciones de componentes
import { ObraSocialDialogComponent } from './obra-social-dialog/obra-social-dialog.component';

/**
 * Interfaz para los datos de la tabla de obras sociales
 */
interface ObraSocialTableItem extends ObraSocial {
  acciones?: any; // Para las columnas de acciones
}

/**
 * Componente principal de gestión de obras sociales
 */
@Component({
  selector: 'app-obras-sociales',
  templateUrl: './obras-sociales.component.html',
  styleUrls: ['./obras-sociales.component.scss'],
  imports: [CommonModule, MaterialModule, FormsModule],
  standalone: true
})
export class ObrasSocialesComponent implements OnInit, AfterViewInit {
  // Referencias a componentes de Material
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Configuración de la tabla
  displayedColumns: string[] = ['ID', 'Nombre', 'Descripcion', 'acciones'];
  dataSource = new MatTableDataSource<ObraSocialTableItem>([]);

  // Estado del componente
  isLoading = true;
  errorMessage = '';

  // Filtros
  filtroNombre = '';

  // Datos originales para filtrado
  datosOriginales: ObraSocialTableItem[] = [];

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

    // Cargar las obras sociales
    this.cargarObrasSociales();
  }

  /**
   * Método que se ejecuta después de inicializar las vistas
   */
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Carga las obras sociales desde el backend
   */
  cargarObrasSociales(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminService.obtenerObrasSociales().subscribe({
      next: (obrasSociales: ObraSocial[]) => {
        console.log('🏥 Obras sociales cargadas:', obrasSociales);
        
        // Convertir a formato de tabla
        const obrasSocialesTable = obrasSociales.map(obra => ({
          ...obra,
          acciones: null // Placeholder para las acciones
        }));

        this.datosOriginales = [...obrasSocialesTable];
        this.dataSource.data = obrasSocialesTable;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar obras sociales:', error);
        this.errorMessage = 'Error al cargar las obras sociales';
        this.isLoading = false;
      }
    });
  }

  /**
   * Abre el diálogo para crear una nueva obra social
   */
  abrirDialogoNuevaObraSocial(): void {
    const dialogRef = this.dialog.open(ObraSocialDialogComponent, {
      width: '500px',
      disableClose: false,
      data: { modo: 'crear' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🏥 Nueva obra social creada:', result);
        this.mostrarNotificacion('Obra social creada exitosamente', 'success');
        this.cargarObrasSociales(); // Recargar datos
      }
    });
  }

  /**
   * Abre el diálogo para editar una obra social existente
   */
  abrirDialogoEditarObraSocial(obraSocial: ObraSocial): void {
    const dialogRef = this.dialog.open(ObraSocialDialogComponent, {
      width: '500px',
      disableClose: false,
      data: { 
        modo: 'editar',
        obraSocial: obraSocial
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🏥 Obra social editada:', result);
        this.mostrarNotificacion('Obra social actualizada exitosamente', 'success');
        this.cargarObrasSociales(); // Recargar datos
      }
    });
  }

  /**
   * Elimina una obra social (marca como inactiva)
   */
  eliminarObraSocial(obraSocial: ObraSocial): void {
    if (confirm(`¿Está seguro que desea eliminar la obra social "${obraSocial.Nombre}"?`)) {
      this.adminService.eliminarObraSocial(obraSocial.ID).subscribe({
        next: () => {
          console.log('🏥 Obra social eliminada:', obraSocial.ID);
          this.mostrarNotificacion('Obra social eliminada exitosamente', 'success');
          this.cargarObrasSociales(); // Recargar datos
        },
        error: (error) => {
          console.error('❌ Error al eliminar obra social:', error);
          this.mostrarNotificacion('Error al eliminar la obra social', 'error');
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
      datosFiltrados = datosFiltrados.filter(obra =>
        obra.Nombre.toLowerCase().includes(filtro) ||
        (obra.Descripcion && obra.Descripcion.toLowerCase().includes(filtro))
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