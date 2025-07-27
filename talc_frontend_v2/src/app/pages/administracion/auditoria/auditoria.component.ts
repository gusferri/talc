import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';

export interface RegistroAuditoria {
  ID: number;
  FechaHora: string;
  ID_Usuario: number;
  Username: string;
  Accion: string;
  Tabla: string;
  ID_Registro: number;
  Campo_Modificado: string;
  Valor_Anterior: string;
  Valor_Nuevo: string;
  IP_Address: string;
  User_Agent: string;
  Comentario: string;
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.scss']
})
export class AuditoriaComponent implements OnInit {
  displayedColumns: string[] = [
    'FechaHora', 'Username', 'Accion', 'Tabla', 'ID_Registro', 
    'Campo_Modificado', 'Valor_Anterior', 'Valor_Nuevo', 'Comentario'
  ];
  
  dataSource: RegistroAuditoria[] = [];
  isLoading = false;
  
  // Filtros
  filtroTabla = '';
  filtroAccion = '';
  filtroUsuario = '';
  filtroFechaDesde: Date | null = null;
  filtroFechaHasta: Date | null = null;
  
  // Paginación
  totalRegistros = 0;
  pageSize = 50;
  pageIndex = 0;
  
  // Opciones de filtro
  opcionesTablas = ['Usuario', 'Profesional', 'Paciente', 'Turno', 'Adjunto', 'NotaVoz', 'InformeIA'];
  opcionesAcciones = ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.cargarAuditoria();
  }

  cargarAuditoria(): void {
    this.isLoading = true;
    
    const params = {
      tabla: this.filtroTabla || undefined,
      accion: this.filtroAccion || undefined,
      usuario: this.filtroUsuario || undefined,
      fecha_desde: this.filtroFechaDesde ? this.filtroFechaDesde.toISOString().split('T')[0] : undefined,
      fecha_hasta: this.filtroFechaHasta ? this.filtroFechaHasta.toISOString().split('T')[0] : undefined,
      limite: this.pageSize
    };

    this.adminService.obtenerAuditoria(params).subscribe({
      next: (response) => {
        this.dataSource = response.registros;
        this.totalRegistros = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar auditoría:', error);
        this.isLoading = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.pageIndex = 0;
    this.cargarAuditoria();
  }

  limpiarFiltros(): void {
    this.filtroTabla = '';
    this.filtroAccion = '';
    this.filtroUsuario = '';
    this.filtroFechaDesde = null;
    this.filtroFechaHasta = null;
    this.pageIndex = 0;
    this.cargarAuditoria();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.cargarAuditoria();
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-AR');
  }

  truncarTexto(texto: string, maxLength: number = 50): string {
    if (!texto) return '';
    return texto.length > maxLength ? texto.substring(0, maxLength) + '...' : texto;
  }
} 