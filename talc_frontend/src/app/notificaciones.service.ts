import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {

  private apiUrl = 'http://192.168.2.41:8000/notificaciones';

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