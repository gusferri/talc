import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { PacienteService } from '../../services/paciente.service';
import { TurnosService } from '../../services/turnos.service';

export interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  route: string;
}

export interface QuickAction {
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}

@Component({
  selector: 'app-starter',
  templateUrl: './starter.component.html',
  imports: [MaterialModule, CommonModule],
  styleUrls: ['./starter.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StarterComponent implements OnInit {
  isLoading = true;
  nombreUsuario = '';
  currentDate = new Date();
  
  // Estadísticas
  stats: StatCard[] = [
    {
      title: 'Pacientes',
      value: 0,
      icon: 'people',
      color: '#2196f3',
      route: '/pacientes'
    },
    {
      title: 'Turnos Hoy',
      value: 0,
      icon: 'event',
      color: '#ff9800',
      route: '/turnos'
    },
    {
      title: 'Turnos Pendientes',
      value: 0,
      icon: 'schedule',
      color: '#f44336',
      route: '/turnos'
    }
  ];

  // Acciones rápidas
  quickActions: QuickAction[] = [
    {
      title: 'Nuevo Paciente',
      description: 'Registrar un nuevo paciente en el sistema',
      icon: 'person_add',
      color: '#4caf50',
      route: '/pacientes/nuevo'
    },
    {
      title: 'Nuevo Turno',
      description: 'Programar una nueva cita o turno',
      icon: 'event_available',
      color: '#ff9800',
      route: '/turnos/nuevo'
    },
    {
      title: 'Ver Agenda',
      description: 'Consultar la agenda de turnos',
      icon: 'calendar_today',
      color: '#2196f3',
      route: '/turnos'
    }
  ];

  // Turnos de hoy
  turnosHoy: any[] = [];

  constructor(
    private router: Router,
    private pacienteService: PacienteService,
    private turnosService: TurnosService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
    this.nombreUsuario = localStorage.getItem('nombreCompleto') || 'Usuaria';
  }

  cargarDatos(): void {
    this.isLoading = true;
    const rol = (localStorage.getItem('rol') || '').toLowerCase();
    const shortname = localStorage.getItem('username');
    if (rol === 'secretaria') {
      // Mostrar todos los pacientes
      this.pacienteService.obtenerPacientes().subscribe({
        next: (pacientes: any[]) => {
          this.stats[0].value = pacientes.length;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error al cargar pacientes:', error);
          this.stats[0].value = 0;
          this.isLoading = false;
        }
      });
    } else if (shortname) {
      // Mostrar solo los pacientes del profesional
      this.pacienteService.obtenerPacientesPorProfesional(shortname).subscribe({
        next: (pacientes: any[]) => {
          this.stats[0].value = pacientes.length;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error al cargar pacientes del profesional:', error);
          this.stats[0].value = 0;
          this.isLoading = false;
        }
      });
    } else {
      this.stats[0].value = 0;
      this.isLoading = false;
    }

    // Cargar turnos
    this.turnosService.obtenerTurnos().subscribe({
      next: (data: any[]) => {
        const nombreProfesional = this.normalizarTexto(localStorage.getItem('nombreCompleto') || '');
        // Obtener fecha local en formato YYYY-MM-DD (misma lógica que turnos.component.ts)
        const hoy = new Date();
        const hoyStr = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
        console.log('Hoy (local):', hoyStr);
        // Log de todas las fechas recibidas
        console.log('Fechas de todos los turnos:', data.map(t => t.Fecha));
        const ahora = new Date();
        const horaActual = ahora.toTimeString().slice(0,5); // HH:mm
        const estadosPendientes = ['agendado', 'pendiente', 'confirmado'];

        let turnosHoy: any[] = [];
        if (rol === 'secretaria') {
          // Ver todos los turnos de hoy, de todas las profesionales
          turnosHoy = data.filter((turno: any) => turno.Fecha && turno.Fecha.substring(0, 10) === hoyStr);
        } else {
          // Solo los turnos de la profesional logueada (con normalización)
          turnosHoy = data.filter((turno: any) => 
            turno.Fecha && turno.Fecha.substring(0, 10) === hoyStr &&
            turno.Profesional && this.normalizarTexto(turno.Profesional) === nombreProfesional
          );
        }
        // Log de las fechas de los turnos que pasan el filtro hoy:
        console.log('Fechas de turnos que pasan el filtro hoy:', turnosHoy.map(t => t.Fecha));

        // Turnos pendientes: los de hoy, cuya hora es mayor a la actual y estado válido
        const turnosPendientes = turnosHoy.filter((turno: any) => {
          return (
            turno.Hora && turno.Hora > horaActual &&
            turno.Estado && estadosPendientes.includes((turno.Estado || '').toLowerCase())
          );
        });

        this.stats[1].value = turnosHoy.length;
        this.stats[2].value = turnosPendientes.length;
        this.turnosHoy = turnosHoy;
      },
      error: (error: any) => {
        console.error('Error al cargar turnos:', error);
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

  navegarA(route: string): void {
    this.router.navigate([route]);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }

  formatearHora(hora: string): string {
    if (!hora) return '';
    return hora.substring(0, 5); // Formato HH:MM
  }

  getEstadoColor(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmado':
        return '#4caf50';
      case 'pendiente':
        return '#ff9800';
      case 'cancelado':
        return '#f44336';
      case 'completado':
        return '#2196f3';
      default:
        return '#757575';
    }
  }
}
