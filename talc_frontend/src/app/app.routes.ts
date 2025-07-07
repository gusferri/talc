import { Routes } from '@angular/router';
import { CalendarioComponent } from './turnos/calendario/calendario.component';
import { ReportesComponent } from './turnos/reportes/reportes.component';
import { PacientesComponent } from './pacientes/pacientes.component';
import { MenuPrincipalComponent } from './menu-principal/menu-principal.component'; // 👈 Ensure this file exists at the specified path
import { LoginComponent } from './login/login.component';
import { authGuard } from './guards/auth.guard';
import { NuevoPacienteComponent } from './pacientes/nuevo-paciente/nuevo-paciente.component';
import { EditarPacienteComponent } from './pacientes/editar-paciente/editar-paciente.component';
import { AgendaComponent } from './pacientes/agenda/agenda.component';
import { SeguimientoEvolutivoComponent } from './pacientes/seguimiento-evolutivo/seguimiento-evolutivo.component';
import { NotasVozComponent } from './pacientes/notas-voz/notas-voz.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'menu-principal', pathMatch: 'full' }, // 👈 Redirigir al nuevo menú principal
  { path: 'menu-principal', component: MenuPrincipalComponent, canActivate: [authGuard] }, // 👈 Nueva ruta
  {
    path: 'turnos',
    canActivate: [authGuard],
    children: [
      { path: 'calendario', component: CalendarioComponent },
      { path: 'reportes', component: ReportesComponent },
      {
        path: 'nuevo-turno',
        loadComponent: () => import('./turnos/nuevo-turno/nuevo-turno.component').then(m => m.NuevoTurnoComponent)
      },
      { path: '', redirectTo: 'calendario', pathMatch: 'full' }
    ]
  },
  {
    path: 'pacientes',
    canActivate: [authGuard],
    children: [
      { path: 'pacientes', component: PacientesComponent},
      { path: 'nuevo-paciente', component: NuevoPacienteComponent},
      { path: 'agenda', component: AgendaComponent },
      { path: 'seguimiento-evolutivo', component: SeguimientoEvolutivoComponent },
      {path: 'notas-voz', component: NotasVozComponent},
      {
        path: 'editar-paciente',
        loadComponent: () =>
          import('./pacientes/editar-paciente/editar-paciente.component').then(m => m.EditarPacienteComponent)
      },
      {
        path: 'editar-paciente/:dni',
        loadComponent: () =>
          import('./pacientes/editar-paciente/editar-paciente.component').then(m => m.EditarPacienteComponent)
      },
      { path: '', redirectTo: 'pacientes', pathMatch: 'full' }
    ]
  },
];