import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ObraSocialService {
    private apiUrl = `${environment.apiBaseUrl}/pacientes`;

    constructor(private http: HttpClient) {}

    buscarObrasSociales(query: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/buscarObrasSociales`, {
            params: { query }
        });
    }

    obtenerObrasSociales(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/obtenerObrasSociales`);
    }
} 