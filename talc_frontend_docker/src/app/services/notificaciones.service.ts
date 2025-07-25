import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {

  private apiUrl = `${environment.apiBaseUrl}/notificaciones`;

  constructor(private http: HttpClient) { }

  // Traer todas las notificaciones de un usuario
  obtenerNotificaciones(): Observable<any[]> {
    const username = localStorage.getItem('username') || '';
    return this.http.get<any[]>(`${this.apiUrl}?username=${username}`);
  }

  // Marcar una notificación como leída
  marcarComoLeida(idNotificacion: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/marcarLeido`, { id_notificacion: idNotificacion });
  }
} 