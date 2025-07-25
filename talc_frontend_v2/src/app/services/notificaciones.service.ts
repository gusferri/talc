import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class NotificacionesService {
    private apiUrl = `${environment.apiBaseUrl}/notificaciones`;

    constructor(private http: HttpClient) {}

    obtenerNotificaciones(username: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}?username=${username}`);
    }

    marcarComoLeido(idNotificacion: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/marcarLeido`, { id_notificacion: idNotificacion });
    }
} 