import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NotasVozService {
    private apiUrl = 'http://192.168.2.41:8000/api/';

    constructor(private http: HttpClient) {}

    subirNotaVoz(turnoId: number, audioBlob: Blob): Observable<any> {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'nota_voz.webm'); // o .wav si lo preferís
        formData.append('turno_id', turnoId.toString());
        return this.http.post(`${this.apiUrl}notas-voz`, formData);
    }

    obtenerNotaVoz(turnoId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}obtener-notas-voz/${turnoId}`);
    }

    actualizarNotaVoz(id: number, texto: string): Observable<any> {
        return this.http.post(`${this.apiUrl}actualizar-notas-voz/${id}`, { texto });
    }
} 