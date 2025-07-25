import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PacientesComponent } from './pacientes/pacientes.component';
import { TurnosComponent } from './turnos/turnos.component';
import { NuevoPacienteComponent } from './pacientes/nuevo-paciente/nuevo-paciente.component';
import { DetallePacienteComponent } from './pacientes/detalle-paciente/detalle-paciente.component';
import { NuevoTurnoComponent } from './turnos/nuevo-turno.component';
import { ReportesComponent } from './turnos/reportes.component';
import { CalendarioComponent } from './turnos/calendario.component';

export const PagesRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    data: {
      title: 'Dashboard',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Dashboard' },
      ],
    },
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    data: {
      title: 'Dashboard',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Dashboard' },
      ],
    },
  },
  {
    path: 'pacientes',
    component: PacientesComponent,
    data: {
      title: 'Gestión de Pacientes',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Pacientes' },
      ],
    },
  },
  {
    path: 'pacientes/nuevo',
    component: NuevoPacienteComponent,
    data: {
      title: 'Nuevo Paciente',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Pacientes', url: '/pacientes' },
        { title: 'Nuevo Paciente' },
      ],
    },
  },
  {
    path: 'pacientes/notasvoz',
    loadComponent: () => import('./pacientes/notas-voz-por-paciente/notas-voz-por-paciente.component').then(m => m.NotasVozPorPacienteComponent),
    data: {
      title: 'Notas de Voz por Paciente',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Pacientes', url: '/pacientes' },
        { title: 'Notas de Voz' }
      ],
    },
  },
  {
    path: 'pacientes/seguimiento-evolutivo',
    loadComponent: () => import('./pacientes/seguimiento-evolutivo-por-paciente/seguimiento-evolutivo-por-paciente.component')
      .then(m => m.SeguimientoEvolutivoPorPacienteComponent),
    data: {
      title: 'Seguimiento Evolutivo por Paciente',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Pacientes', url: '/pacientes' },
        { title: 'Seguimiento Evolutivo' }
      ],
    },
  },
  {
    path: 'pacientes/:id',
    component: DetallePacienteComponent,
    data: {
      title: 'Detalle Paciente',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Pacientes', url: '/pacientes' },
        { title: 'Detalle Paciente' },
      ],
    },
  },
  {
    path: 'turnos',
    component: TurnosComponent,
    data: {
      title: 'Gestión de Turnos',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Turnos' },
      ],
    },
  },
  {
    path: 'turnos/nuevo',
    component: NuevoTurnoComponent,
    data: {
      title: 'Nuevo Turno',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Turnos', url: '/turnos' },
        { title: 'Nuevo Turno' },
      ],
    },
  },
  {
    path: 'turnos/editar/:id',
    component: NuevoTurnoComponent,
    data: {
      title: 'Editar Turno',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Turnos', url: '/turnos' },
        { title: 'Editar Turno' }
      ],
    },
  },
  {
    path: 'turnos/reportes',
    component: ReportesComponent,
    data: {
      title: 'Reportes de Turnos',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Turnos', url: '/turnos' },
        { title: 'Reportes' }
      ],
    },
  },
  {
    path: 'turnos/calendario',
    loadComponent: () => import('./turnos/calendario.component').then(m => m.CalendarioComponent),
    data: {
      title: 'Calendario de Turnos',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Turnos', url: '/turnos' },
        { title: 'Calendario' }
      ],
    },
  },
];
