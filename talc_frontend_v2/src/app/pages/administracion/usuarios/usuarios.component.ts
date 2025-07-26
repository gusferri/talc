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
import { AdminService, Usuario } from '../../../services/admin.service';

// Importaciones de componentes
import { UsuarioDialogComponent } from './usuario-dialog/usuario-dialog.component';

/**
 * Interfaz para los datos de la tabla de usuarios
 */
interface UsuarioTableItem extends Usuario {
  acciones?: any; // Para las columnas de acciones
}

/**
 * Componente principal de gestión de usuarios
 */
@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, 
            MatDialogModule, MatSnackBarModule, MatIconModule, MatButtonModule, 
            MatCardModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, 
            MatTooltipModule, FormsModule],
  standalone: true
})
export class UsuariosComponent implements OnInit, AfterViewInit {
  // Propiedades para la tabla
  displayedColumns: string[] = ['Username', 'NombreCompleto', 'Email', 'Rol', 'Estado', 'acciones'];
  dataSource: MatTableDataSource<UsuarioTableItem> = new MatTableDataSource<UsuarioTableItem>();

  // Referencias a componentes de Material
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Estados del componente
  isLoading: boolean = false;
  filtroNombre: string = '';

  // Lista de usuarios
  usuarios: Usuario[] = [];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Carga la lista de usuarios desde el backend
   */
  cargarUsuarios(): void {
    this.isLoading = true;
    
    this.adminService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.dataSource.data = usuarios.map(usuario => ({
          ...usuario,
          acciones: null // Para las columnas de acciones
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar usuarios:', error);
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  /**
   * Aplica filtros a la tabla
   */
  aplicarFiltros(): void {
    const filtro = this.filtroNombre.toLowerCase().trim();
    
    this.dataSource.filterPredicate = (data: UsuarioTableItem, filter: string) => {
      const searchStr = filter.toLowerCase();
      return (
        data.Username?.toLowerCase().includes(searchStr) ||
        data.NombreCompleto?.toLowerCase().includes(searchStr) ||
        data.Email?.toLowerCase().includes(searchStr) ||
        data.Rol?.toLowerCase().includes(searchStr)
      );
    };
    
    this.dataSource.filter = filtro;
  }

  /**
   * Abre el diálogo para crear un nuevo usuario
   */
  abrirDialogoNuevoUsuario(): void {
    const dialogRef = this.dialog.open(UsuarioDialogComponent, {
      width: '600px',
      data: { modo: 'crear' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarUsuarios();
        this.snackBar.open('Usuario creado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  /**
   * Abre el diálogo para editar un usuario existente
   */
  abrirDialogoEditarUsuario(usuario: Usuario): void {
    const dialogRef = this.dialog.open(UsuarioDialogComponent, {
      width: '600px',
      data: { modo: 'editar', usuario: usuario }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarUsuarios();
        this.snackBar.open('Usuario actualizado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  /**
   * Navega de vuelta al panel de administración
   */
  volverAAdministracion(): void {
    this.router.navigate(['/administracion']);
  }
} 