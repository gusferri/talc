/**
 * Servicio de Informes - Gestión de informes evolutivos y generación con IA
 *
 * Este servicio maneja las operaciones relacionadas con los informes
 * evolutivos de pacientes en el sistema TALC, incluyendo la generación
 * automática de informes utilizando inteligencia artificial.
 *
 * Funcionalidades principales:
 * - Obtener informes por paciente específico
 * - Actualizar contenido de informes existentes
 * - Generar informes automáticos con IA
 * - Manejo de errores en generación de informes
 * - Integración con servicios de IA
 *
 * Arquitectura:
 * - Servicio inyectable con HttpClient
 * - Comunicación REST con el backend
 * - Manejo de observables y operadores RxJS
 * - Interfaces TypeScript para tipado fuerte
 * - Manejo de errores con catchError
 */

// Importaciones de Angular y RxJS
import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Configuración del entorno
import { environment } from '../../environments/environment';

/**
 * Interfaz para la solicitud de generación de informes con IA
 */
export interface GenerarInformeRequest {
  /** ID del paciente para el cual generar el informe */
  ID_Paciente: number;
  /** ID del profesional que solicita el informe */
  ID_Profesional: number;
  /** Tipo de informe a generar (interdisciplinario o por área) */
  TipoInforme: 'interdisciplinario' | 'area';
}

/**
 * Interfaz para la respuesta de generación de informes con IA
 */
export interface GenerarInformeResponse {
  /** Resumen generado por la IA */
  resumen: string;
}

/**
 * Servicio para gestionar informes evolutivos de pacientes
 */
@Injectable({
    providedIn: 'root'
})
export class InformesService {
    /** URL base para las operaciones de informes */
    private apiUrl = environment.apiBaseUrl;

    /**
     * Constructor: inicializa el cliente HTTP
     */
    constructor(private http: HttpClient) {}

    /**
     * Obtiene todos los informes asociados a un paciente específico
     * Utilizado para mostrar el historial de informes del paciente
     * 
     * @param id_paciente - ID del paciente para obtener sus informes
     * @returns Observable con array de informes del paciente
     */
    getInformesPorPaciente(id_paciente: number): Observable<any> {
        return this.http.get(`${this.apiUrl}informes-por-paciente/${id_paciente}`);
    }

    /**
     * Actualiza el contenido de un informe existente
     * Permite editar el texto de un informe ya generado
     * 
     * @param id - ID del informe a actualizar
     * @param texto - Nuevo contenido del informe
     * @returns Observable con respuesta de la actualización
     */
    actualizarInforme(id: number, texto: string): Observable<any> {
        return this.http.post(`${this.apiUrl}actualizar-informe/${id}`, { texto });
    }

    /**
     * Genera un informe automático utilizando inteligencia artificial
     * Crea un resumen basado en los datos del paciente y el tipo de informe
     * 
     * @param payload - Datos para la generación del informe (paciente, profesional, tipo)
     * @returns Observable con el resumen generado por la IA
     */
    createInformeIA(payload: GenerarInformeRequest): Observable<GenerarInformeResponse> {
      return this.http.post<GenerarInformeResponse>(`${this.apiUrl}generar-informe`, payload)
        .pipe(
          catchError(err => {
            console.error('❌ Error al generar informe:', err);
            return throwError(() => err);
          })
        );
    }
} 