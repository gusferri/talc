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
}

/**
 * Interfaz para un profesional
 */
export interface Profesional {
  ID: number;
  Nombre: string;
  Apellido: string;
  Especialidad: string;
  Email: string;
  Telefono: string;
  Activo: boolean;
}

/**
 * Interfaz para un usuario
 */
export interface Usuario {
  ID: number;
  Username: string;
  Nombre: string;
  Apellido: string;
  Email: string;
  Activo: boolean;
  roles: string[];
}

/**
 * Interfaz para una obra social
 */
export interface ObraSocial {
  ID: number;
  Nombre: string;
  Descripcion?: string;
  Activo: boolean;
}

/**
 * Interfaz para una escuela
 */
export interface Escuela {
  ID: number;
  Nombre: string;
  Direccion?: string;
  ID_Ciudad: number;
  Ciudad?: string;
  Activo: boolean;
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
   * Crea un nuevo profesional
   * 
   * @param profesional - Datos del profesional a crear
   * @returns Observable con el profesional creado
   */
  crearProfesional(profesional: Omit<Profesional, 'ID'>): Observable<Profesional> {
    return this.http.post<Profesional>(`${this.apiUrl}/administracion/profesionales`, profesional);
  }

  /**
   * Actualiza un profesional existente
   * 
   * @param id - ID del profesional a actualizar
   * @param profesional - Datos actualizados del profesional
   * @returns Observable con el profesional actualizado
   */
  actualizarProfesional(id: number, profesional: Partial<Profesional>): Observable<Profesional> {
    return this.http.put<Profesional>(`${this.apiUrl}/administracion/profesionales/${id}`, profesional);
  }

  /**
   * Elimina un profesional (marca como inactivo)
   * 
   * @param id - ID del profesional a eliminar
   * @returns Observable con confirmación
   */
  eliminarProfesional(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/administracion/profesionales/${id}`);
  }

  /**
   * Crea un nuevo usuario
   * 
   * @param usuario - Datos del usuario a crear
   * @returns Observable con el usuario creado
   */
  crearUsuario(usuario: Omit<Usuario, 'ID'>): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/administracion/usuarios`, usuario);
  }

  /**
   * Actualiza un usuario existente
   * 
   * @param id - ID del usuario a actualizar
   * @param usuario - Datos actualizados del usuario
   * @returns Observable con el usuario actualizado
   */
  actualizarUsuario(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/administracion/usuarios/${id}`, usuario);
  }

  /**
   * Elimina un usuario (marca como inactivo)
   * 
   * @param id - ID del usuario a eliminar
   * @returns Observable con confirmación
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
} 