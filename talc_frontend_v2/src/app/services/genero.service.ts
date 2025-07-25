/**
 * Servicio de Géneros - Gestión de catálogo de géneros
 *
 * Este servicio maneja las operaciones relacionadas con el catálogo
 * de géneros utilizados en el sistema TALC, principalmente para
 * el registro y edición de pacientes.
 *
 * Funcionalidades principales:
 * - Obtener lista completa de géneros disponibles
 * - Integración con el backend para catálogos
 * - Manejo de datos para formularios de pacientes
 *
 * Arquitectura:
 * - Servicio inyectable con HttpClient
 * - Comunicación REST con el backend
 * - Manejo de observables para datos asíncronos
 */

// Importaciones de Angular y RxJS
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Configuración del entorno
import { environment } from '../../environments/environment';

/**
 * Servicio para gestionar el catálogo de géneros
 */
@Injectable({
    providedIn: 'root'
})
export class GeneroService {
    /** URL base para las operaciones de pacientes (incluye géneros) */
    private apiUrl = `${environment.apiBaseUrl}/pacientes`;

    /**
     * Constructor: inicializa el cliente HTTP
     */
    constructor(private http: HttpClient) {}

    /**
     * Obtiene la lista completa de géneros disponibles
     * Utilizado para poblar selectores en formularios de pacientes
     * 
     * @returns Observable con array de géneros
     */
    buscarGeneros(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/buscarGeneros`);
    }
} 