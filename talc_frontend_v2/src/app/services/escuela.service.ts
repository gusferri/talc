/**
 * Servicio de Escuela - Gestión de catálogo de escuelas
 *
 * Este servicio maneja las operaciones relacionadas con el catálogo
 * de escuelas utilizadas en el sistema TALC, principalmente para
 * el registro y edición de pacientes.
 *
 * Funcionalidades principales:
 * - Búsqueda de escuelas por ciudad específica
 * - Obtención de lista completa de escuelas
 * - Integración con formularios de pacientes
 * - Filtrado dependiente de la ubicación del paciente
 *
 * Arquitectura:
 * - Servicio inyectable con HttpClient
 * - Comunicación REST con parámetros de consulta
 * - Manejo de observables para datos asíncronos
 * - Filtrado por ubicación geográfica
 */

// Importaciones de Angular y RxJS
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Configuración del entorno
import { environment } from '../../environments/environment';

/**
 * Servicio para gestionar el catálogo de escuelas
 */
@Injectable({
    providedIn: 'root'
})
export class EscuelaService {
    /** URL base para las operaciones de pacientes (incluye escuelas) */
    private apiUrlBase = `${environment.apiBaseUrl}/pacientes`;

    /**
     * Constructor: inicializa el cliente HTTP
     */
    constructor(private http: HttpClient) {}

    /**
     * Busca escuelas que pertenezcan a una ciudad específica
     * Utilizado para filtrar escuelas según la ubicación del paciente
     * 
     * @param query - Texto para buscar en el nombre de la escuela
     * @param idCiudad - ID de la ciudad para filtrar escuelas
     * @returns Observable con array de escuelas de la ciudad especificada
     */
    buscarEscuelasPorCiudad(query: string, idCiudad: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrlBase}/buscarEscuelasPorCiudad`, {
            params: { query, id: idCiudad }
        });
    }

    /**
     * Obtiene la lista completa de escuelas
     * Utilizado para poblar selectores sin filtrado por ciudad
     * 
     * @returns Observable con array de todas las escuelas
     */
    obtenerEscuelas(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrlBase}/obtenerEscuelas`);
    }
} 