// Importaciones necesarias para el servicio de turnos
// Injectable: Decorador que permite la inyección de dependencias
import { Injectable } from '@angular/core';
// HttpClient: Servicio para realizar peticiones HTTP al backend
import { HttpClient } from '@angular/common/http';
// Turno: Modelo de datos para representar un turno
import { Turno } from '../models/turno.model';
// Observable: Tipo de RxJS para manejar flujos de datos asíncronos
import { Observable } from 'rxjs';
// environment: Configuración del entorno (URLs de la API)
import { environment } from '../../environments/environment';

/**
 * Servicio TurnosService - Gestión de operaciones relacionadas con turnos/citas
 * 
 * Este servicio centraliza todas las operaciones HTTP relacionadas con turnos,
 * proporcionando una interfaz unificada para la gestión de citas médicas.
 * 
 * Funcionalidades principales:
 * - CRUD completo de turnos (Crear, Leer, Actualizar)
 * - Gestión de estados de turnos (agendado, confirmado, cancelado, etc.)
 * - Registro de asistencia a turnos
 * - Obtención de profesionales y especialidades
 * - Gestión de disponibilidad de horarios
 * 
 * Responsabilidades:
 * - Comunicación con el backend para operaciones de turnos
 * - Gestión del ciclo de vida de los turnos
 * - Coordinación entre pacientes, profesionales y especialidades
 * - Control de estados y asistencia
 */
@Injectable({
  providedIn: 'root'  // El servicio está disponible en toda la aplicación
})
export class TurnosService {

  // URL base para operaciones de turnos con detalles completos
  private apiUrl = `${environment.apiBaseUrl}/turnos/detalle`;

  /**
   * Constructor del servicio
   * Inyecta el HttpClient para realizar peticiones HTTP
   */
  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los turnos del sistema con información detallada
   * Incluye datos de pacientes, profesionales y especialidades
   * 
   * @returns Observable con array de turnos completos
   */
  obtenerTurnos(): Observable<Turno[]> {
    return this.http.get<Turno[]>(this.apiUrl);
  }

  /**
   * Actualiza el estado de un turno específico
   * Permite cambiar entre estados como: agendado, confirmado, cancelado, completado
   * 
   * @param turnoID - ID del turno a actualizar
   * @param nuevoEstado - Nuevo estado del turno (número que representa el estado)
   * @returns Observable con la respuesta del servidor
   */
  actualizarEstadoTurno(turnoID: number, nuevoEstado: number) {
    return this.http.put(`${environment.apiBaseUrl}/turnos/${turnoID}/estado`, { 
      ID_EstadoTurno: nuevoEstado 
    });
  }

  /**
   * Registra la asistencia de un paciente a un turno
   * Marca el turno como asistido cuando el paciente acude a la cita
   * 
   * @param turnoID - ID del turno para registrar asistencia
   * @returns Observable con la respuesta del servidor
   */
  registrarAsistencia(turnoID: number) {
    return this.http.post(`${environment.apiBaseUrl}/turnos/${turnoID}/asistencia`, {});
  }

  /**
   * Obtiene la lista de todos los profesionales disponibles
   * Utilizado para mostrar opciones al crear/editar turnos
   * 
   * @returns Observable con array de profesionales
   */
  obtenerProfesionales() {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/turnos/profesionales`);
  }

  /**
   * Obtiene las especialidades que maneja un profesional específico
   * Utilizado para filtrar especialidades al crear turnos
   * 
   * @param idProfesional - ID del profesional
   * @returns Observable con array de especialidades del profesional
   */
  obtenerEspecialidadesPorProfesional(idProfesional: number) {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/turnos/especialidades-por-profesional/${idProfesional}`);
  }

  /**
   * Crea un nuevo turno en el sistema
   * Valida disponibilidad y crea la cita médica
   * 
   * @param turno - Objeto con los datos del turno a crear
   * @returns Observable con la respuesta del servidor
   */
  crearTurno(turno: any) {
    return this.http.post(`${environment.apiBaseUrl}/turnos`, turno);
  }

  /**
   * Obtiene un turno específico por su ID
   * Utilizado para editar turnos existentes
   * 
   * @param id - ID del turno a obtener
   * @returns Observable con los datos del turno
   */
  obtenerTurnoPorId(id: number) {
    return this.http.get<any>(`${environment.apiBaseUrl}/pacientes/turno/${id}`);
  }

  /**
   * Actualiza los datos de un turno existente
   * Permite modificar fecha, hora, paciente, profesional o especialidad
   * 
   * @param id - ID del turno a actualizar
   * @param turno - Objeto con los nuevos datos del turno
   * @returns Observable con la respuesta del servidor
   */
  actualizarTurno(id: number, turno: any) {
    return this.http.put(`${environment.apiBaseUrl}/turnos/${id}`, turno);
  }
} 