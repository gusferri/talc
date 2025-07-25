/**
 * Servicio de Ubicación - Gestión de provincias y ciudades
 *
 * Este servicio maneja las operaciones relacionadas con la ubicación
 * geográfica en el sistema TALC, incluyendo provincias y ciudades
 * para el registro y edición de pacientes.
 *
 * Funcionalidades principales:
 * - Búsqueda de provincias con filtrado por texto
 * - Búsqueda de ciudades por provincia con filtrado
 * - Obtención de listas completas de provincias y ciudades
 * - Integración con formularios de pacientes
 *
 * Arquitectura:
 * - Servicio inyectable con HttpClient
 * - Comunicación REST con parámetros de consulta
 * - Manejo de observables para datos asíncronos
 * - Filtrado dinámico en el backend
 */

// Importaciones de Angular y RxJS
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Configuración del entorno
import { environment } from '../../environments/environment';

/**
 * Servicio para gestionar datos de ubicación geográfica
 */
@Injectable({
    providedIn: 'root'
})
export class UbicacionService {
    /** URL base para las operaciones de ubicación */
    private apiUrlBase = `${environment.apiBaseUrl}/pacientes`;

    /**
     * Constructor: inicializa el cliente HTTP
     */
    constructor(private http: HttpClient) {}

    /**
     * Busca provincias que coincidan con el texto de consulta
     * Utilizado para autocompletado en formularios
     * 
     * @param query - Texto de búsqueda para filtrar provincias
     * @returns Observable con array de provincias filtradas
     */
    buscarProvincias(query: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrlBase}/buscarProvincias`, {
            params: { query }
        });
    }

    /**
     * Busca ciudades de una provincia específica que coincidan con el texto
     * Utilizado para autocompletado dependiente de la provincia seleccionada
     * 
     * @param idProvincia - ID de la provincia para filtrar ciudades
     * @param query - Texto de búsqueda para filtrar ciudades
     * @returns Observable con array de ciudades filtradas
     */
    buscarCiudadesPorProvincia(idProvincia: number, query: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrlBase}/buscarCiudadesPorProvincia`, {
            params: { id: idProvincia, query }
        });
    }

    /**
     * Obtiene la lista completa de provincias
     * Utilizado para poblar selectores sin filtrado
     * 
     * @returns Observable con array de todas las provincias
     */
    obtenerProvincias(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrlBase}/obtenerProvincias`);
    }

    /**
     * Obtiene la lista completa de ciudades
     * Utilizado para poblar selectores sin filtrado
     * 
     * @returns Observable con array de todas las ciudades
     */
    obtenerCiudades(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrlBase}/obtenerCiudades`);
    }
} 