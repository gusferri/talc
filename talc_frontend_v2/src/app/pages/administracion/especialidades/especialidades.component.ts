import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

// Importaciones de servicios
import { AuthService } from '../../../services/auth.service';
import { AdminService, Especialidad } from '../../../services/admin.service';

// Importaciones de componentes
import { EspecialidadDialogComponent } from './especialidad-dialog/especialidad-dialog.component';

/**
 * Interfaz para los datos de la tabla de especialidades
 */
interface EspecialidadTableItem extends Especialidad {
  acciones?: any; // Para las columnas de acciones
}

/**
 * Componente principal de gestión de especialidades
 */
@Component({
  selector: 'app-especialidades',
  templateUrl: './especialidades.component.html',
  styleUrls: ['./especialidades.component.scss'],
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, 
            MatDialogModule, MatSnackBarModule, MatIconModule, MatButtonModule, 
            MatCardModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, 
            MatTooltipModule, FormsModule],
  standalone: true
})
export class EspecialidadesComponent implements OnInit, AfterViewInit {
  // Referencias a componentes de Material
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Configuración de la tabla
  displayedColumns: string[] = ['Nombre', 'Descripcion', 'acciones'];
  dataSource = new MatTableDataSource<EspecialidadTableItem>([]);

  // Estado del componente
  isLoading = true;
  errorMessage = '';

  // Filtros
  filtroNombre = '';

  // Datos originales para filtrado
  datosOriginales: EspecialidadTableItem[] = [];

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

    // Cargar las especialidades
    this.cargarEspecialidades();
  }

  /**
   * Método que se ejecuta después de inicializar las vistas
   */
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Carga las especialidades desde el backend
   */
  cargarEspecialidades(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminService.obtenerEspecialidades().subscribe({
      next: (especialidades: Especialidad[]) => {
        console.log('🎯 Especialidades cargadas:', especialidades);
        
        // Convertir a formato de tabla
        const especialidadesTable = especialidades.map(especialidad => ({
          ...especialidad,
          acciones: null // Placeholder para las acciones
        }));

        this.datosOriginales = [...especialidadesTable];
        this.dataSource.data = especialidadesTable;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar especialidades:', error);
        this.errorMessage = 'Error al cargar las especialidades';
        this.isLoading = false;
      }
    });
  }

  /**
   * Abre el diálogo para crear una nueva especialidad
   */
  abrirDialogoNuevaEspecialidad(): void {
    const dialogRef = this.dialog.open(EspecialidadDialogComponent, {
      width: '500px',
      data: { modo: 'crear' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Nueva especialidad creada:', result);
        this.mostrarNotificacion('Especialidad creada exitosamente', 'success');
        this.cargarEspecialidades(); // Recargar datos
      }
    });
  }

  /**
   * Abre el diálogo para editar una especialidad existente
   */
  abrirDialogoEditarEspecialidad(especialidad: Especialidad): void {
    const dialogRef = this.dialog.open(EspecialidadDialogComponent, {
      width: '500px',
      data: { 
        modo: 'editar',
        especialidad: especialidad
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Especialidad actualizada:', result);
        this.mostrarNotificacion('Especialidad actualizada exitosamente', 'success');
        this.cargarEspecialidades(); // Recargar datos
      }
    });
  }

  /**
   * Aplica los filtros a la tabla
   */
  aplicarFiltros(): void {
    const filtro = this.filtroNombre.toLowerCase().trim();
    
    if (filtro === '') {
      this.dataSource.data = [...this.datosOriginales];
    } else {
      const datosFiltrados = this.datosOriginales.filter(especialidad =>
        especialidad.Nombre.toLowerCase().includes(filtro) ||
        (especialidad.Descripcion && especialidad.Descripcion.toLowerCase().includes(filtro))
      );
      this.dataSource.data = datosFiltrados;
    }
  }

  /**
   * Limpia todos los filtros aplicados
   */
  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.dataSource.data = [...this.datosOriginales];
  }

  /**
   * Muestra una notificación al usuario
   */
  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: tipo === 'success' ? 'success-snackbar' : 'error-snackbar'
    });
  }

  /**
   * Navega de vuelta al panel de administración
   */
  volverAAdministracion(): void {
    this.router.navigate(['/administracion']);
  }
} 