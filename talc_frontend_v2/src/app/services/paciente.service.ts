// Importaciones necesarias para el servicio de pacientes
// Injectable: Decorador que permite la inyección de dependencias
import { Injectable } from '@angular/core';
// HttpClient: Servicio para realizar peticiones HTTP al backend
import { HttpClient } from '@angular/common/http';
// Observable: Tipo de RxJS para manejar flujos de datos asíncronos
import { Observable } from 'rxjs';
// map: Operador de RxJS para transformar datos en el flujo
import { map } from 'rxjs/operators';
// environment: Configuración del entorno (URLs de la API)
import { environment } from '../../environments/environment';

/**
 * Servicio PacienteService - Gestión de operaciones relacionadas con pacientes
 * 
 * Este servicio centraliza todas las operaciones HTTP relacionadas con pacientes,
 * proporcionando una interfaz unificada para el resto de la aplicación.
 * 
 * Funcionalidades principales:
 * - CRUD completo de pacientes (Crear, Leer, Actualizar)
 * - Búsqueda y filtrado de pacientes
 * - Gestión de turnos por paciente
 * - Verificación de roles de profesionales
 * - Gestión de archivos adjuntos
 * 
 * Responsabilidades:
 * - Comunicación con el backend para operaciones de pacientes
 * - Transformación de datos para el frontend
 * - Manejo de parámetros de consulta
 * - Gestión de autenticación y autorización
 */
@Injectable({
    providedIn: 'root'  // El servicio está disponible en toda la aplicación
})
export class PacienteService {
    // URL base para todas las operaciones de pacientes
    private apiUrl = `${environment.apiBaseUrl}/pacientes`;
    
    /**
     * Constructor del servicio
     * Inyecta el HttpClient para realizar peticiones HTTP
     */
    constructor(private http: HttpClient) {}

    /**
     * Formatea el nombre completo de un paciente para mostrar
     * Convierte el objeto paciente en un string legible
     * 
     * @param paciente - Objeto con datos del paciente
     * @returns String formateado con apellido y nombre
     */
    displayPaciente(paciente: any): string {
        return paciente ? `${paciente.Apellido}, ${paciente.Nombre}` : '';
    }

    /**
     * Obtiene los turnos de un paciente y los formatea para el calendario
     * Transforma los datos del backend al formato requerido por el componente de calendario
     * 
     * @param idPaciente - ID del paciente para obtener sus turnos
     * @returns Observable con array de turnos formateados para calendario
     */
    obtenerTurnosPorPacienteFormateados(idPaciente: number): Observable<any[]> {
        return this.obtenerTurnosPorPaciente(idPaciente).pipe(
            map((turnos: any[]) =>
                turnos
                .filter(t => t.Fecha && t.Hora)  // Filtra turnos con fecha y hora válidas
                .map(t => {
                    // Crea objeto Date para comparar con fecha actual
                    const startDateTime = new Date(`${t.Fecha}T${t.Hora.length === 5 ? t.Hora + ':00' : t.Hora}`);
                    // Determina si debe mostrar icono de nota de voz (turnos pasados)
                    const mostrarIconoNotaVoz = startDateTime < new Date();
                    
                    return {
                        title: t.Especialidad ? `${t.Especialidad}` : 'Turno',  // Título del evento
                        estado: t.EstadoTurno || '',                            // Estado del turno
                        start: `${t.Fecha}T${t.Hora.length === 5 ? t.Hora + ':00' : t.Hora}`,  // Fecha y hora de inicio
                        allDay: false,                                          // No es evento de todo el día
                        cantidadNotasVoz: t.CantidadNotasVoz || 0,             // Cantidad de notas de voz
                        mostrarIconoNotaVoz                                     // Flag para mostrar icono
                    };
                })
            )
        );
    }
    
    /**
     * Busca pacientes por término de búsqueda
     * Permite búsqueda por nombre, apellido o DNI
     * 
     * @param query - Término de búsqueda
     * @returns Observable con array de pacientes que coinciden con la búsqueda
     */
    buscarPacientes(query: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/buscarPacientes`, {
            params: { query }  // Pasa el término de búsqueda como parámetro
        });
    }

    /**
     * Obtiene un paciente específico por DNI sin filtrar por estado activo
     * Utilizado para edición de pacientes (activos e inactivos)
     * 
     * @param dni - DNI del paciente a obtener
     * @returns Observable con los datos del paciente
     */
    obtenerPacientePorDni(dni: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/paciente/${dni}`);
    }

    /**
     * Inserta un nuevo paciente en el sistema
     * Envía los datos del paciente al backend para su creación
     * 
     * @param paciente - Objeto con todos los datos del paciente a crear
     * @returns Observable con la respuesta del backend
     */
    insertarPaciente(paciente: any): Observable<any> {
        const headers = this.getHeadersWithUser();
        return this.http.post(`${this.apiUrl}/grabarPaciente`, paciente, { headers });
    }

    /**
     * Actualiza los datos de un paciente existente
     * Envía los datos actualizados al backend
     * 
     * @param dni - DNI del paciente a actualizar
     * @param paciente - Objeto con los datos actualizados del paciente
     * @returns Observable con la respuesta del backend
     */
    actualizarPaciente(dni: any, paciente: any): Observable<any> {
        const headers = this.getHeadersWithUser();
        return this.http.put(`${this.apiUrl}/actualizarPaciente/${dni}`, paciente, { headers });
    }

    /**
     * Adjunta un archivo a un paciente
     * Utiliza FormData para enviar archivos al servidor
     * 
     * @param formData - FormData con el archivo y metadatos
     * @returns Observable con la respuesta del servidor
     */
    adjuntarArchivo(formData: FormData): Observable<any> {
        return this.http.post(`${this.apiUrl}/adjuntos`, formData);
    }

    /**
     * Verifica si un usuario es un profesional basado en su shortname
     * Utilizado para determinar qué funcionalidades mostrar
     * 
     * @param shortname - Nombre de usuario a verificar
     * @returns Observable con información sobre si es profesional
     */
    esProfesionalPorShortname(shortname: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/esProfesionalPorShortname?shortname=${shortname}`);
    }

    /**
     * Obtiene todos los pacientes asignados a un profesional específico
     * Filtra pacientes según el profesional logueado
     * 
     * @param shortname - Nombre de usuario del profesional
     * @returns Observable con array de pacientes del profesional
     */
    obtenerPacientesPorProfesional(shortname: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/profesional?shortname=${shortname}`);
    }

    /**
     * Obtiene todos los turnos de un paciente específico
     * Incluye información sobre notas de voz asociadas
     * 
     * @param idPaciente - ID del paciente
     * @returns Observable con array de turnos del paciente
     */
    obtenerTurnosPorPaciente(idPaciente: number): Observable<any[]> {
        const username = localStorage.getItem('username') || '';  // Obtiene el usuario logueado
        return this.http.get<any[]>(`${this.apiUrl}/turnosPorPaciente`, {
            params: {
                id_paciente: idPaciente,  // ID del paciente
                username                  // Usuario logueado para autorización
            }
        });
    }

    /**
     * Obtiene el ID del profesional directamente por username
     * Optimiza las consultas evitando comparaciones de strings
     * 
     * @param username - Nombre de usuario del profesional
     * @returns Observable con el ID del profesional
     */
    obtenerIdProfesionalPorUsername(username: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/obtenerIdProfesionalPorUsername`, {
            params: { username }
        });
    }

    /**
     * Obtiene información de un profesional por su nombre de usuario
     * 
     * @param username - Nombre de usuario del profesional
     * @returns Observable con datos del profesional
     */
    obtenerProfesionalPorUsername(username: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/obtenerProfesionalPorUsername`, {
            params: { username }
        });
    }

    /**
     * Obtiene todos los turnos del usuario logueado
     * Utilizado para mostrar agenda personal
     * 
     * @returns Observable con array de turnos del usuario
     */
    obtenerTurnos(): Observable<any[]> {
        const username = localStorage.getItem('username') || '';  // Obtiene el usuario logueado
        return this.http.get<any[]>(`${this.apiUrl}/turnos`, {
            params: {
                username  // Usuario logueado para filtrar turnos
            }
        });
    }

    /**
     * Obtiene un paciente específico por su ID
     * 
     * @param id - ID del paciente a buscar
     * @returns Observable con datos del paciente
     */
    obtenerPacientePorId(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/buscarPorId`, {
            params: { id }
        });
    }

    /**
     * Obtiene todos los pacientes del sistema
     * Utilizado principalmente por secretarias para ver todos los pacientes
     * 
     * @returns Observable con array de todos los pacientes
     */
    obtenerPacientes() {
        return this.http.get<any[]>(`${environment.apiBaseUrl}/pacientes/completo`);
    }

    /**
     * Actualiza el estado activo/inactivo de un paciente
     * 
     * @param dni - DNI del paciente
     * @param activo - Estado (1 = activo, 0 = inactivo)
     * @returns Observable con la respuesta del backend
     */
    actualizarEstadoPaciente(dni: string, activo: number): Observable<any> {
        const headers = this.getHeadersWithUser();
        return this.http.put(`${this.apiUrl}/pacientes/${dni}/estado`, { activo }, { headers });
    }

    /**
     * Obtiene las opciones de estado para pacientes
     * Retorna las opciones disponibles para el campo activo/inactivo
     * 
     * @returns Array con las opciones de estado
     */
    obtenerOpcionesEstado(): any[] {
        return [
            { id: 1, nombre: 'Activo', descripcion: 'Paciente activo en el sistema' },
            { id: 0, nombre: 'Inactivo', descripcion: 'Paciente inactivo en el sistema' }
        ];
    }

    /**
     * Obtiene headers con el usuario logueado para auditoría
     */
    private getHeadersWithUser(): { [key: string]: string } {
        const username = localStorage.getItem('username');
        return {
            'Content-Type': 'application/json',
            'X-User-Username': username || 'sistema'
        };
    }
} 