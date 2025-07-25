import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class NotasVozService {
    private apiUrl = `${environment.apiBaseUrl}/api/`;

    constructor(private http: HttpClient) {}

    grabarNotaVoz(formData: FormData): Observable<any> {
        return this.http.post(`${this.apiUrl}notas-voz`, formData);
    }

    obtenerNotasVoz(turnoId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}obtener-notas-voz/${turnoId}`);
    }

    actualizarNotaVoz(id: number, texto: string): Observable<any> {
        return this.http.post(`${this.apiUrl}actualizar-notas-voz/${id}`, { texto });
    }
} 