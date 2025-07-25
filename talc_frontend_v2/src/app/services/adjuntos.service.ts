// Importaciones necesarias para el servicio de adjuntos
// Injectable: Decorador que permite la inyección de dependencias
import { Injectable } from '@angular/core';
// HttpClient y HttpHeaders: Para realizar peticiones HTTP al backend
import { HttpClient, HttpHeaders } from '@angular/common/http';
// Observable: Tipo de RxJS para manejar flujos de datos asíncronos
import { Observable } from 'rxjs';
// environment: Configuración del entorno (URLs de la API)
import { environment } from '../../environments/environment';

/**
 * Interfaz que define la estructura de datos de un adjunto desde el backend
 * Representa la información de un archivo adjunto a un paciente
 */
export interface AdjuntoBackend {
  /** ID único del adjunto en la base de datos */
  ID: number;
  
  /** Nombre original del archivo */
  Nombre: string;
  
  /** Tipo MIME del archivo (ej: application/pdf, image/jpeg) */
  Tipo: string;
  
  /** Fecha de subida del archivo en formato string */
  Fecha: string;
  
  /** Tamaño del archivo en bytes */
  Tamaño: number;
  
  /** URL opcional para acceder al archivo */
  URL?: string;
}

/**
 * Servicio AdjuntosService - Gestión de archivos adjuntos de pacientes
 * 
 * Este servicio centraliza todas las operaciones relacionadas con archivos adjuntos,
 * proporcionando una interfaz unificada para subir, descargar, visualizar y eliminar
 * documentos asociados a pacientes.
 * 
 * Funcionalidades principales:
 * - Obtener lista de adjuntos de un paciente
 * - Subir nuevos archivos adjuntos
 * - Descargar archivos adjuntos
 * - Visualizar archivos en el navegador
 * - Eliminar archivos adjuntos
 * 
 * Responsabilidades:
 * - Comunicación con el backend para operaciones de archivos
 * - Manejo de FormData para subida de archivos
 * - Gestión de tipos de respuesta (JSON, Blob)
 * - Proporcionar URLs para acceso a archivos
 */
@Injectable({
  providedIn: 'root'  // El servicio está disponible en toda la aplicación
})
export class AdjuntosService {
  // URL base del backend para todas las operaciones
  private baseUrl = environment.apiBaseUrl;

  /**
   * Constructor del servicio
   * Inyecta el HttpClient para realizar peticiones HTTP
   */
  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los archivos adjuntos de un paciente específico
   * Retorna la lista de documentos asociados al paciente
   * 
   * @param idPaciente - ID del paciente para obtener sus adjuntos
   * @returns Observable con array de adjuntos del paciente
   */
  obtenerAdjuntos(idPaciente: number): Observable<AdjuntoBackend[]> {
    return this.http.get<AdjuntoBackend[]>(`${this.baseUrl}/pacientes/adjuntos/${idPaciente}`).pipe(
      // Aquí podrías agregar manejo de errores si es necesario
    );
  }

  /**
   * Sube un nuevo archivo adjunto al sistema
   * Utiliza FormData para enviar el archivo y metadatos al backend
   * 
   * @param formData - FormData que contiene el archivo y metadatos
   * @returns Observable con la respuesta del servidor
   */
  subirAdjunto(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/pacientes/adjuntos`, formData);
  }

  /**
   * Descarga un archivo adjunto específico
   * Retorna el archivo como Blob para permitir la descarga
   * 
   * @param documentoId - ID del documento a descargar
   * @returns Observable con el archivo como Blob
   */
  descargarAdjunto(documentoId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/pacientes/adjuntos/descargar/${documentoId}`, {
      responseType: 'blob'  // Especifica que la respuesta debe ser tratada como Blob
    });
  }

  /**
   * Visualiza un archivo adjunto en el navegador
   * Retorna el archivo como Blob para visualización directa
   * Útil para mostrar PDFs, imágenes, etc. en el navegador
   * 
   * @param documentoId - ID del documento a visualizar
   * @returns Observable con el archivo como Blob
   */
  visualizarAdjunto(documentoId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/pacientes/adjuntos/visualizar/${documentoId}`, {
      responseType: 'blob'  // Especifica que la respuesta debe ser tratada como Blob
    });
  }

  /**
   * Elimina un archivo adjunto del sistema
   * Remueve permanentemente el archivo del servidor
   * 
   * @param documentoId - ID del documento a eliminar
   * @returns Observable con la respuesta del servidor
   */
  eliminarAdjunto(documentoId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/pacientes/adjuntos/${documentoId}`);
  }
} 