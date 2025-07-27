/**
 * Servicio de Administración - Gestión de operaciones administrativas
 *
 * Este servicio maneja todas las operaciones relacionadas con el módulo de administración
 * del sistema TALC, incluyendo estadísticas, gestión de profesionales, usuarios, etc.
 *
 * Funcionalidades principales:
 * - Obtención de estadísticas del sistema
 * - Gestión de profesionales (CRUD)
 * - Gestión de usuarios (CRUD)
 * - Gestión de obras sociales (CRUD)
 * - Gestión de escuelas (CRUD)
 *
 * Arquitectura:
 * - Servicio inyectable con comunicación HTTP
 * - Manejo centralizado de operaciones administrativas
 * - Manejo de errores consistente
 * - Tipado fuerte para todas las operaciones
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Interfaz para las estadísticas del sistema
 */
export interface EstadisticasSistema {
  total_profesionales: number;
  total_usuarios: number;
  total_obras_sociales: number;
  total_escuelas: number;
  total_especialidades: number;
}

/**
 * Interfaz para un profesional
 */
export interface Profesional {
  ID: number;
  Nombre: string;
  Apellido: string;
  Email: string;
  Telefono: string;
  DNI?: string;
  Matricula?: string;
  FechaNacimiento?: string;
  Genero?: string;
  NombreGenero?: string;
  Domicilio?: string;
  ID_Provincia?: number;
  ID_Ciudad?: number;
  Observaciones?: string;
  UsaIntegracionCalendar?: boolean;
  Activo?: boolean;
  Especialidad?: string;
  Especialidades?: number[];
  NombreCiudad?: string;
  NombreProvincia?: string;
}

export interface Especialidad {
  ID_Especialidad: number;
  Nombre: string;
  Descripcion?: string;
}

/**
 * Interfaz para un usuario
 */
export interface Usuario {
  ID: number;
  Username: string;
  NombreCompleto: string;
  Email: string;
  Rol: string;
  Activo: boolean;
}

/**
 * Interfaz para una obra social
 */
export interface ObraSocial {
  ID: number;
  Nombre: string;
}

/**
 * Interfaz para una escuela
 */
export interface Escuela {
  ID: number;
  Nombre: string;
  ID_Ciudad: number;
  Ciudad?: string;
  Provincia?: string;
}

/**
 * Interfaz para un registro de auditoría
 */
export interface RegistroAuditoria {
  ID: number;
  FechaHora: string;
  ID_Usuario: number;
  Username: string;
  Accion: string;
  Tabla: string;
  ID_Registro: number;
  Campo_Modificado: string;
  Valor_Anterior: string;
  Valor_Nuevo: string;
  IP_Address: string;
  User_Agent: string;
  Comentario: string;
}

/**
 * Interfaz para la respuesta de auditoría
 */
export interface AuditoriaResponse {
  total: number;
  registros: RegistroAuditoria[];
}

/**
 * Interfaz para los parámetros de filtro de auditoría
 */
export interface AuditoriaParams {
  tabla?: string;
  accion?: string;
  usuario?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  limite?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  /** URL base para operaciones administrativas */
  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las estadísticas del sistema para el dashboard de administración
   * 
   * @returns Observable con las estadísticas del sistema
   */
  obtenerEstadisticas(): Observable<EstadisticasSistema> {
    return this.http.get<EstadisticasSistema>(`${this.apiUrl}/administracion/estadisticas`);
  }

  /**
   * Obtiene todos los profesionales del sistema
   * 
   * @returns Observable con array de profesionales
   */
  obtenerProfesionales(): Observable<Profesional[]> {
    return this.http.get<Profesional[]>(`${this.apiUrl}/administracion/profesionales`);
  }

  /**
   * Obtiene todos los usuarios del sistema
   * 
   * @returns Observable con array de usuarios
   */
  obtenerUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/administracion/usuarios`);
  }

  /**
   * Obtiene todas las obras sociales del sistema
   * 
   * @returns Observable con array de obras sociales
   */
  obtenerObrasSociales(): Observable<ObraSocial[]> {
    return this.http.get<ObraSocial[]>(`${this.apiUrl}/administracion/obras-sociales`);
  }

  /**
   * Obtiene todas las escuelas del sistema
   * 
   * @returns Observable con array de escuelas
   */
  obtenerEscuelas(): Observable<Escuela[]> {
    return this.http.get<Escuela[]>(`${this.apiUrl}/administracion/escuelas`);
  }

  /**
   * Obtiene todas las especialidades del sistema
   * 
   * @returns Observable con array de especialidades
   */
  obtenerEspecialidades(): Observable<Especialidad[]> {
    return this.http.get<Especialidad[]>(`${this.apiUrl}/administracion/especialidades`);
  }

  /**
   * Crea una nueva especialidad
   * 
   * @param especialidad - Datos de la especialidad a crear
   * @returns Observable con la especialidad creada
   */
  crearEspecialidad(especialidad: Omit<Especialidad, 'ID_Especialidad'>): Observable<Especialidad> {
    return this.http.post<Especialidad>(`${this.apiUrl}/administracion/especialidades`, especialidad);
  }

  /**
   * Actualiza una especialidad existente
   * 
   * @param id - ID de la especialidad a actualizar
   * @param especialidad - Datos actualizados de la especialidad
   * @returns Observable con la especialidad actualizada
   */
  actualizarEspecialidad(id: number, especialidad: Partial<Especialidad>): Observable<Especialidad> {
    return this.http.put<Especialidad>(`${this.apiUrl}/administracion/especialidades/${id}`, especialidad);
  }

  /**
   * Elimina una especialidad (solo si no está en uso)
   * 
   * @param id - ID de la especialidad a eliminar
   * @returns Observable con confirmación
   */
  eliminarEspecialidad(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/administracion/especialidades/${id}`);
  }

  /**
   * Crea un nuevo profesional
   * 
   * @param profesional - Datos del profesional a crear
   * @returns Observable con el profesional creado
   */
  crearProfesional(profesional: Omit<Profesional, 'ID'>): Observable<Profesional> {
    const headers = this.getHeadersWithUser();
    return this.http.post<Profesional>(`${this.apiUrl}/administracion/profesionales`, profesional, { headers });
  }

  /**
   * Actualiza un profesional existente
   * 
   * @param id - ID del profesional a actualizar
   * @param profesional - Datos actualizados del profesional
   * @returns Observable con el profesional actualizado
   */
  actualizarProfesional(id: number, profesional: Partial<Profesional>): Observable<Profesional> {
    const headers = this.getHeadersWithUser();
    return this.http.put<Profesional>(`${this.apiUrl}/administracion/profesionales/${id}`, profesional, { headers });
  }

  /**
   * Crea un nuevo usuario
   */
  crearUsuario(usuario: Omit<Usuario, 'ID'>): Observable<Usuario> {
    const headers = this.getHeadersWithUser();
    return this.http.post<Usuario>(`${this.apiUrl}/administracion/usuarios`, usuario, { headers });
  }

  /**
   * Actualiza un usuario existente
   */
  actualizarUsuario(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
    const headers = this.getHeadersWithUser();
    return this.http.put<Usuario>(`${this.apiUrl}/administracion/usuarios/${id}`, usuario, { headers });
  }

  /**
   * Elimina un usuario
   */
  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/administracion/usuarios/${id}`);
  }

  /**
   * Crea una nueva obra social
   * 
   * @param obraSocial - Datos de la obra social a crear
   * @returns Observable con la obra social creada
   */
  crearObraSocial(obraSocial: Omit<ObraSocial, 'ID'>): Observable<ObraSocial> {
    return this.http.post<ObraSocial>(`${this.apiUrl}/administracion/obras-sociales`, obraSocial);
  }

  /**
   * Actualiza una obra social existente
   * 
   * @param id - ID de la obra social a actualizar
   * @param obraSocial - Datos actualizados de la obra social
   * @returns Observable con la obra social actualizada
   */
  actualizarObraSocial(id: number, obraSocial: Partial<ObraSocial>): Observable<ObraSocial> {
    return this.http.put<ObraSocial>(`${this.apiUrl}/administracion/obras-sociales/${id}`, obraSocial);
  }

  /**
   * Elimina una obra social (marca como inactiva)
   * 
   * @param id - ID de la obra social a eliminar
   * @returns Observable con confirmación
   */
  eliminarObraSocial(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/administracion/obras-sociales/${id}`);
  }

  /**
   * Crea una nueva escuela
   * 
   * @param escuela - Datos de la escuela a crear
   * @returns Observable con la escuela creada
   */
  crearEscuela(escuela: Omit<Escuela, 'ID'>): Observable<Escuela> {
    return this.http.post<Escuela>(`${this.apiUrl}/administracion/escuelas`, escuela);
  }

  /**
   * Actualiza una escuela existente
   * 
   * @param id - ID de la escuela a actualizar
   * @param escuela - Datos actualizados de la escuela
   * @returns Observable con la escuela actualizada
   */
  actualizarEscuela(id: number, escuela: Partial<Escuela>): Observable<Escuela> {
    return this.http.put<Escuela>(`${this.apiUrl}/administracion/escuelas/${id}`, escuela);
  }

  /**
   * Elimina una escuela (marca como inactiva)
   * 
   * @param id - ID de la escuela a eliminar
   * @returns Observable con confirmación
   */
  eliminarEscuela(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/administracion/escuelas/${id}`);
  }

  /**
   * Obtiene el historial de auditoría con filtros opcionales
   * 
   * @param params - Parámetros de filtro para la auditoría
   * @returns Observable con la respuesta de auditoría
   */
  obtenerAuditoria(params: AuditoriaParams): Observable<AuditoriaResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.tabla) queryParams.append('tabla', params.tabla);
    if (params.accion) queryParams.append('accion', params.accion);
    if (params.usuario) queryParams.append('usuario', params.usuario);
    if (params.fecha_desde) queryParams.append('fecha_desde', params.fecha_desde);
    if (params.fecha_hasta) queryParams.append('fecha_hasta', params.fecha_hasta);
    if (params.limite) queryParams.append('limite', params.limite.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.apiUrl}/administracion/auditoria?${queryString}` : `${this.apiUrl}/administracion/auditoria`;
    
    return this.http.get<AuditoriaResponse>(url);
  }

  private getHeadersWithUser(): { [key: string]: string } {
    const username = localStorage.getItem('username');
    return {
      'Content-Type': 'application/json',
      'X-User-Username': username || 'sistema'
    };
  }
} 