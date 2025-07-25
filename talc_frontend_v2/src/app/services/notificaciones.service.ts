// Importaciones necesarias para el servicio de notificaciones
// Injectable: Decorador que permite la inyección de dependencias
import { Injectable } from '@angular/core';
// HttpClient: Servicio para realizar peticiones HTTP al backend
import { HttpClient } from '@angular/common/http';
// Observable: Tipo de RxJS para manejar flujos de datos asíncronos
import { Observable } from 'rxjs';
// environment: Configuración del entorno (URLs de la API)
import { environment } from '../../environments/environment';

/**
 * Servicio NotificacionesService - Gestión de notificaciones del sistema TALC
 * 
 * Este servicio centraliza todas las operaciones relacionadas con notificaciones,
 * proporcionando una interfaz unificada para obtener y gestionar notificaciones
 * de usuarios del sistema.
 * 
 * Funcionalidades principales:
 * - Obtener notificaciones de un usuario específico
 * - Marcar notificaciones como leídas
 * - Gestión del estado de lectura de notificaciones
 * - Filtrado de notificaciones por usuario
 * 
 * Responsabilidades:
 * - Comunicación con el backend para operaciones de notificaciones
 * - Gestión del estado de lectura de notificaciones
 * - Proporcionar notificaciones personalizadas por usuario
 * - Mantener sincronización del estado de notificaciones
 * 
 * Casos de uso:
 * - Mostrar notificaciones de turnos próximos
 * - Alertas de cambios en el sistema
 * - Recordatorios de tareas pendientes
 * - Notificaciones de nuevos mensajes o eventos
 */
@Injectable({
    providedIn: 'root'  // El servicio está disponible en toda la aplicación
})
export class NotificacionesService {
    // URL base para todas las operaciones de notificaciones
    private apiUrl = `${environment.apiBaseUrl}/notificaciones`;

    /**
     * Constructor del servicio
     * Inyecta el HttpClient para realizar peticiones HTTP
     */
    constructor(private http: HttpClient) {}

    /**
     * Obtiene todas las notificaciones de un usuario específico
     * Retorna la lista de notificaciones no leídas y recientes
     * 
     * @param username - Nombre de usuario para obtener sus notificaciones
     * @returns Observable con array de notificaciones del usuario
     */
    obtenerNotificaciones(username: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}?username=${username}`);
    }

    /**
     * Marca una notificación específica como leída
     * Actualiza el estado de la notificación en el backend
     * 
     * @param idNotificacion - ID de la notificación a marcar como leída
     * @returns Observable con la respuesta del servidor
     */
    marcarComoLeido(idNotificacion: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/marcarLeido`, { id_notificacion: idNotificacion });
    }
} 