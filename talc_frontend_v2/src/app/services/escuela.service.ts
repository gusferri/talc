import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class EscuelaService {
    private apiUrlBase = `${environment.apiBaseUrl}/pacientes`;

    constructor(private http: HttpClient) {}

    buscarEscuelasPorCiudad(ciudad: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrlBase}/buscarEscuelasPorCiudad`, {
            params: { ciudad }
        });
    }

    obtenerEscuelas(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrlBase}/obtenerEscuelas`);
    }
} 