import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TurnosService } from '../../services/turnos.service';
import { Turno } from '../../models/turno.model';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-turnos',
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.scss'],
  imports: [
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
  turnos: MatTableDataSource<Turno> = new MatTableDataSource<Turno>();
  displayedColumns: string[] = ['paciente', 'profesional', 'especialidad', 'fecha', 'hora', 'estado', 'acciones'];
  searchTerm: string = '';
  isLoading: boolean = false;
  filtroFecha: 'hoy' | 'semana' | 'todos' = 'hoy';
  datosOriginales: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private router: Router, private turnosService: TurnosService, private snackBar: MatSnackBar, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['paciente']) {
        this.searchTerm = params['paciente'];
        this.filtroFecha = 'todos'; // Selecciona el filtro 'Todos'
        setTimeout(() => {
          this.aplicarFiltro({ target: { value: this.searchTerm } } as any);
        });
      }
    });
    this.cargarTurnos();
  }

  ngAfterViewInit(): void {
    this.turnos.paginator = this.paginator;
    this.turnos.sort = this.sort;
  }

  cargarTurnos(): void {
    this.isLoading = true;
    const rol = (localStorage.getItem('rol') || '').toLowerCase();
    const nombreProfesional = (localStorage.getItem('nombreCompleto') || '');
    this.turnosService.obtenerTurnos().subscribe({
      next: (data: Turno[]) => {
        let turnosFiltrados = data;
        if (rol !== 'secretaria') {
          turnosFiltrados = data.filter(turno =>
            turno.Profesional &&
            this.normalizarTexto(turno.Profesional) === this.normalizarTexto(nombreProfesional)
          );
        }
        // Marcar como ausente los turnos pasados sin asistencia/cancelación/ausente
        const ahora = new Date();
        turnosFiltrados.forEach(turno => {
          const fechaHoraFin = new Date(`${turno.Fecha}T${turno.Hora}`);
          if (
            fechaHoraFin < ahora &&
            turno.Estado !== 'Cancelado' &&
            turno.Estado !== 'Ausente' &&
            turno.Estado !== 'Asistido'
          ) {
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

  normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quita tildes
      .replace(/\s+/g, ' ') // Espacios múltiples a uno solo
      .trim();
  }

  nuevoTurno(): void {
    this.router.navigate(['/turnos/nuevo']);
  }

  editarTurno(turno: Turno): void {
    this.router.navigate(['/turnos/editar', turno.ID]);
  }

  verDetalleTurno(turno: Turno): void {
    this.router.navigate(['/turnos/detalle', turno.ID]);
  }

  cambiarEstadoTurno(turno: Turno, nuevoEstado: number): void {
    this.turnosService.actualizarEstadoTurno(turno.ID, nuevoEstado).subscribe({
      next: () => {
        this.cargarTurnos(); // Solo recarga la tabla
        this.snackBar.open('Turno cancelado correctamente', 'Cerrar', { duration: 2500 });
      },
      error: (error) => {
        console.error('Error al actualizar estado del turno:', error);
        this.snackBar.open('Error al cancelar el turno', 'Cerrar', { duration: 3000 });
      }
    });
  }

  registrarAsistencia(turno: Turno): void {
    this.turnosService.registrarAsistencia(turno.ID).subscribe({
      next: () => {
        // Recargar los turnos después de registrar asistencia
        this.cargarTurnos();
      },
      error: (error) => {
        console.error('Error al registrar asistencia:', error);
      }
    });
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.turnos.filter = filterValue.trim().toLowerCase();

    if (this.turnos.paginator) {
      this.turnos.paginator.firstPage();
    }
  }

  getEstadoColor(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmado':
        return 'primary';
      case 'pendiente':
        return 'warn';
      case 'cancelado':
        return 'accent';
      case 'completado':
        return 'primary';
      default:
        return 'primary';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmado':
        return 'check_circle';
      case 'pendiente':
        return 'schedule';
      case 'cancelado':
        return 'cancel';
      case 'completado':
        return 'done_all';
      default:
        return 'event';
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }

  formatearHora(hora: string): string {
    if (!hora) return '';
    return hora.substring(0, 5); // Mostrar solo HH:MM
  }

  get esRutaTurnos(): boolean {
    return this.router.url.startsWith('/turnos');
  }

  get esRutaPacientes(): boolean {
    return this.router.url.startsWith('/pacientes');
  }

  setFiltroFecha(filtro: 'hoy' | 'semana' | 'todos') {
    this.filtroFecha = filtro;
    this.filtrarTurnos();
  }

  filtrarTurnos() {
    let turnosFiltrados = [...this.datosOriginales];
    // Excluir turnos cancelados
    turnosFiltrados = turnosFiltrados.filter(t => t.Estado?.toLowerCase() !== 'cancelado');
    const hoy = new Date();
    const hoyStr = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
    if (this.filtroFecha === 'hoy') {
      turnosFiltrados = turnosFiltrados.filter(t => t.Fecha && t.Fecha.substring(0, 10) === hoyStr);
    } else if (this.filtroFecha === 'semana') {
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
    // Ordenar de más antiguo a más reciente
    turnosFiltrados.sort((a, b) => new Date(a.Fecha + 'T' + a.Hora).getTime() - new Date(b.Fecha + 'T' + b.Hora).getTime());
    this.turnos.data = turnosFiltrados;
  }

  puedeRegistrarAsistencia(turno: Turno): boolean {
    if (!turno || turno.Estado?.toLowerCase() !== 'agendado' || !turno.Fecha || !turno.Hora) return false;
    const ahora = new Date();
    const fechaHoraTurno = new Date(`${turno.Fecha}T${turno.Hora}`);
    const diffMs = fechaHoraTurno.getTime() - ahora.getTime();
    const diffMin = diffMs / 60000;
    return diffMin <= 45 && diffMin >= -30; // Se puede registrar desde 15 min antes hasta 2 horas después
  }


} 