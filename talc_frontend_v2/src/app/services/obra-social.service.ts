/**
 * Servicio de Obra Social - Gestión de catálogo de obras sociales
 *
 * Este servicio maneja las operaciones relacionadas con el catálogo
 * de obras sociales utilizadas en el sistema TALC, principalmente
 * para el registro y edición de pacientes.
 *
 * Funcionalidades principales:
 * - Búsqueda de obras sociales con filtrado por texto
 * - Obtención de lista completa de obras sociales
 * - Integración con formularios de pacientes
 * - Autocompletado en campos de obra social
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
 * Servicio para gestionar el catálogo de obras sociales
 */
@Injectable({
    providedIn: 'root'
})
export class ObraSocialService {
    /** URL base para las operaciones de pacientes (incluye obras sociales) */
    private apiUrl = `${environment.apiBaseUrl}/pacientes`;

    /**
     * Constructor: inicializa el cliente HTTP
     */
    constructor(private http: HttpClient) {}

    /**
     * Busca obras sociales que coincidan con el texto de consulta
     * Utilizado para autocompletado en formularios de pacientes
     * 
     * @param query - Texto de búsqueda para filtrar obras sociales
     * @returns Observable con array de obras sociales filtradas
     */
    buscarObrasSociales(query: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/buscarObrasSociales`, {
            params: { query }
        });
    }

    /**
     * Obtiene la lista completa de obras sociales
     * Utilizado para poblar selectores sin filtrado
     * 
     * @returns Observable con array de todas las obras sociales
     */
    obtenerObrasSociales(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/obtenerObrasSociales`);
    }
} 