import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PacienteService } from '../../services/paciente.service';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-pacientes',
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.scss'],
  imports: [
    CommonModule, 
    MatTableModule, 
    MatPaginatorModule, 
    MatIconModule, 
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    FormsModule,
    RouterModule
  ],
})
export class PacientesComponent implements OnInit, AfterViewInit {
  esProfesional: boolean = false;
  pacientes: MatTableDataSource<any> = new MatTableDataSource<any>();
  displayedColumns: string[] = ['dni', 'nombre', 'apellido', 'edad', 'acciones'];
  searchTerm: string = '';
  isLoading: boolean = false;
  datosOriginales: any[] = [];
  columnaOrden: string = '';
  direccionOrden: 'asc' | 'desc' = 'asc';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(public router: Router, private pacienteService: PacienteService) {}

  ngOnInit(): void {
    this.verificarProfesionalYcargarPacientes();
  }

  ngAfterViewInit(): void {
    this.pacientes.paginator = this.paginator;
  }

  verificarProfesionalYcargarPacientes(): void {
    const shortname = localStorage.getItem('username');
    if (shortname) {
      this.pacienteService.esProfesionalPorShortname(shortname).subscribe({
        next: (res: any) => {
          this.esProfesional = res?.esProfesional === true;
          localStorage.setItem('esProfesional', JSON.stringify(this.esProfesional));
          this.cargarPacientes();
        },
        error: (error: any) => {
          console.error('Error al verificar profesional', error);
          this.esProfesional = false;
          this.cargarPacientes();
        }
      });
    } else {
      this.cargarPacientes();
    }
  }

  cargarPacientes(): void {
    this.isLoading = true;
    const rol = (localStorage.getItem('rol') || '').toLowerCase();
    const shortname = localStorage.getItem('username');
    if (rol === 'secretaria') {
      // Mostrar todos los pacientes
      this.pacienteService.obtenerPacientes().subscribe({
        next: (pacientes: any[]) => {
          this.datosOriginales = [...pacientes];
          this.pacientes.data = pacientes;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error al cargar pacientes', error);
          this.isLoading = false;
        }
      });
    } else if (this.esProfesional && shortname) {
      // Mostrar solo los pacientes del profesional
      this.pacienteService.obtenerPacientesPorProfesional(shortname).subscribe({
        next: (pacientes: any[]) => {
          this.datosOriginales = [...pacientes];
          this.pacientes.data = pacientes;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error al cargar pacientes del profesional', error);
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  ordenarPor(columna: string): void {
    console.log('Ordenando por:', columna);
    
    // Si es la misma columna, cambiar dirección
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      // Nueva columna, empezar con ascendente
      this.columnaOrden = columna;
      this.direccionOrden = 'asc';
    }

    const datosOrdenados = [...this.datosOriginales].sort((a, b) => {
      let valorA: any;
      let valorB: any;

      switch (columna) {
        case 'dni':
          valorA = a.DNI;
          valorB = b.DNI;
          break;
        case 'nombre':
          valorA = a.Nombre?.toLowerCase();
          valorB = b.Nombre?.toLowerCase();
          break;
        case 'apellido':
          valorA = a.Apellido?.toLowerCase();
          valorB = b.Apellido?.toLowerCase();
          break;
        case 'edad':
          valorA = this.calcularEdad(a.FechaNacimiento);
          valorB = this.calcularEdad(b.FechaNacimiento);
          break;
        default:
          valorA = a[columna];
          valorB = b[columna];
      }

      if (valorA < valorB) {
        return this.direccionOrden === 'asc' ? -1 : 1;
      }
      if (valorA > valorB) {
        return this.direccionOrden === 'asc' ? 1 : -1;
      }
      return 0;
    });

    this.pacientes.data = datosOrdenados;
    console.log('Datos ordenados:', this.pacientes.data);
  }

  verDetallePaciente(paciente: any): void {
    this.router.navigate(['/pacientes', paciente.DNI]);
  }

  nuevoPaciente(): void {
    this.router.navigate(['/pacientes/nuevo']);
  }

  agendaPaciente(paciente: any): void {
    this.router.navigate(['/pacientes/agenda', paciente.DNI]);
  }

  seguimientoPaciente(paciente: any): void {
    this.router.navigate(['/pacientes/seguimiento', paciente.DNI]);
  }

  irANotasVoz(paciente: any, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/pacientes/notasvoz'], { queryParams: { pacienteId: paciente.ID || paciente.id } });
  }

  irATurnos(paciente: any, event: Event) {
    event.stopPropagation();
    const nombreCompleto = `${paciente.Nombre} ${paciente.Apellido}`;
    this.router.navigate(['/turnos'], { queryParams: { paciente: nombreCompleto } });
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.pacientes.filter = filterValue.trim().toLowerCase();

    if (this.pacientes.paginator) {
      this.pacientes.paginator.firstPage();
    }
  }

  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  get esRutaTurnos(): boolean {
    return this.router.url.startsWith('/turnos');
  }

  get esRutaPacientes(): boolean {
    return this.router.url.startsWith('/pacientes');
  }
} 