import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';
import { PacientesComponent } from './pacientes/pacientes.component';
import { TurnosComponent } from './turnos/turnos.component';
import { NuevoPacienteComponent } from './pacientes/nuevo-paciente/nuevo-paciente.component';
import { DetallePacienteComponent } from './pacientes/detalle-paciente/detalle-paciente.component';
import { NuevoTurnoComponent } from './turnos/nuevo-turno.component';
import { CalendarioComponent } from './turnos/calendario/calendario.component';
import { ReportesComponent } from './turnos/reportes.component';

export const PagesRoutes: Routes = [
  {
    path: '',
    component: StarterComponent,
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
    component: StarterComponent,
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
    path: 'turnos/calendario',
    component: CalendarioComponent,
    data: {
      title: 'Calendario de Turnos',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Turnos', url: '/turnos' },
        { title: 'Calendario' }
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
];
