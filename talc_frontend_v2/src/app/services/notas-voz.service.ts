// Importaciones necesarias para el servicio de notas de voz
// Injectable: Decorador que permite la inyección de dependencias
import { Injectable } from '@angular/core';
// HttpClient: Servicio para realizar peticiones HTTP al backend
import { HttpClient } from '@angular/common/http';
// Observable: Tipo de RxJS para manejar flujos de datos asíncronos
import { Observable } from 'rxjs';
// environment: Configuración del entorno (URLs de la API)
import { environment } from '../../environments/environment';

/**
 * Servicio NotasVozService - Gestión de notas de voz del sistema TALC
 * 
 * Este servicio centraliza todas las operaciones relacionadas con notas de voz,
 * proporcionando una interfaz unificada para grabar, obtener y actualizar
 * notas de voz asociadas a turnos médicos.
 * 
 * Funcionalidades principales:
 * - Grabar nuevas notas de voz durante o después de un turno
 * - Obtener notas de voz asociadas a un turno específico
 * - Actualizar el texto transcrito de una nota de voz
 * - Manejo de archivos de audio y metadatos
 * 
 * Responsabilidades:
 * - Comunicación con el backend para operaciones de notas de voz
 * - Manejo de FormData para subida de archivos de audio
 * - Gestión de transcripciones de audio a texto
 * - Proporcionar acceso a notas de voz por turno
 * 
 * Casos de uso:
 * - Profesionales graban notas durante la consulta
 * - Transcripción automática de audio a texto
 * - Consulta de notas históricas de un paciente
 * - Actualización de transcripciones manuales
 */
@Injectable({
    providedIn: 'root'  // El servicio está disponible en toda la aplicación
})
export class NotasVozService {
    // URL base para todas las operaciones de notas de voz
    private apiUrl = `${environment.apiBaseUrl}/api/`;

    /**
     * Constructor del servicio
     * Inyecta el HttpClient para realizar peticiones HTTP
     */
    constructor(private http: HttpClient) {}

    /**
     * Graba una nueva nota de voz en el sistema
     * Sube el archivo de audio y metadatos asociados al turno
     * 
     * @param formData - FormData que contiene el archivo de audio y metadatos
     * @returns Observable con la respuesta del servidor
     */
    grabarNotaVoz(formData: FormData): Observable<any> {
        return this.http.post(`${this.apiUrl}notas-voz`, formData);
    }

    /**
     * Obtiene todas las notas de voz asociadas a un turno específico
     * Retorna la lista de notas de voz con sus transcripciones
     * 
     * @param turnoId - ID del turno para obtener sus notas de voz
     * @returns Observable con array de notas de voz del turno
     */
    obtenerNotasVoz(turnoId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}obtener-notas-voz/${turnoId}`);
    }

    /**
     * Actualiza el texto transcrito de una nota de voz específica
     * Permite corregir o completar transcripciones automáticas
     * 
     * @param id - ID de la nota de voz a actualizar
     * @param texto - Nuevo texto transcrito para la nota de voz
     * @returns Observable con la respuesta del servidor
     */
    actualizarNotaVoz(id: number, texto: string): Observable<any> {
        return this.http.post(`${this.apiUrl}actualizar-notas-voz/${id}`, { texto });
    }
} 