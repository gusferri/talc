import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PacienteService } from './paciente.service';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-pacientes',
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css'],
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatIconModule, MatButtonModule],
})
export class PacientesComponent implements OnInit, AfterViewInit {
  esProfesional: boolean = false;
  pacientes: MatTableDataSource<any> = new MatTableDataSource<any>();
  displayedColumns: string[] = ['dni', 'nombre', 'apellido', 'acciones'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(public router: Router, private pacienteService: PacienteService) {}

  ngOnInit(): void {
    const shortname = localStorage.getItem('username');
    if (shortname) {
      const shortnameParsed = localStorage.getItem('username');
      if (shortnameParsed) {
        this.pacienteService.esProfesionalPorShortname(shortnameParsed).subscribe(
          (res: any) => {
            this.esProfesional = res?.esProfesional === true;
            localStorage.setItem('esProfesional', JSON.stringify(this.esProfesional));
            this.cargarPacientes();
          },
          (error: any) => {
            console.error('Error al verificar profesional', error);
            this.esProfesional = false;
            this.cargarPacientes();
          }
        );
      }
    }
  }

  ngAfterViewInit(): void {
    this.pacientes.paginator = this.paginator;
    this.pacientes.sort = this.sort;
  }

  cargarPacientes(): void {
    if (this.esProfesional) {
      // Cargar solo los pacientes del profesional
      const shortname = localStorage.getItem('username');
      if (shortname) {
        this.pacienteService.obtenerPacientesPorProfesional(shortname).subscribe(
          (pacientes: any[]) => {
            this.pacientes.data = pacientes;
          },
          (error: any) => console.error('Error al cargar pacientes del profesional', error)
        );
      }
    }
  }

  verDetallePaciente(paciente: any): void {
    this.router.navigate(['/pacientes/editar-paciente', paciente.DNI]);
  }

  get esRutaTurnos(): boolean {
    return this.router.url.startsWith('/turnos');
  }

  get esRutaPacientes(): boolean {
    return this.router.url.startsWith('/pacientes');
  }
}