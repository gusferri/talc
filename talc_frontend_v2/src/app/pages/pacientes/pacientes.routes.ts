import { Routes } from '@angular/router';

export const PACIENTES_ROUTES: Routes = [
  {
    path: 'notasvoz',
    loadComponent: () => import('./notas-voz-por-paciente/notas-voz-por-paciente.component').then(m => m.NotasVozPorPacienteComponent)
  }
  // Aquí puedes agregar otras rutas de pacientes si es necesario
]; 