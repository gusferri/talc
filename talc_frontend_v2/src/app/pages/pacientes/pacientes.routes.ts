/**
 * Rutas específicas del módulo de pacientes
 * 
 * Este archivo define las rutas lazy-loaded para funcionalidades
 * específicas relacionadas con la gestión de pacientes.
 * 
 * Funcionalidades incluidas:
 * - Gestión de notas de voz por paciente
 * - Otras funcionalidades especializadas de pacientes
 * 
 * Características:
 * - Lazy loading para optimización de rendimiento
 * - Rutas modulares y organizadas
 * - Carga bajo demanda de componentes
 */

// Importación del tipo Routes de Angular Router
import { Routes } from '@angular/router';

/**
 * Array de rutas específicas para el módulo de pacientes
 * Define las rutas lazy-loaded para funcionalidades especializadas
 */
export const PACIENTES_ROUTES: Routes = [
  {
    path: 'notasvoz',  // Ruta para gestión de notas de voz
    // Lazy loading del componente de notas de voz por paciente
    loadComponent: () => import('./notas-voz-por-paciente/notas-voz-por-paciente.component')
      .then(m => m.NotasVozPorPacienteComponent)
  }
  // Aquí puedes agregar otras rutas de pacientes si es necesario
  // Ejemplos de futuras rutas:
  // - seguimiento-evolutivo
  // - agenda-especializada
  // - reportes-paciente
  // - documentacion-avanzada
]; 