import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface GenerarInformeRequest {
  ID_Paciente: number;
  ID_Profesional: number;
  TipoInforme: 'interdisciplinario' | 'area';
}

export interface GenerarInformeResponse {
  resumen: string;
}

@Injectable({
    providedIn: 'root'
})
export class InformesService {
    private apiUrl = 'http://192.168.2.41:8000/';

    constructor(private http: HttpClient) {}

    getInformesPorPaciente(id_paciente: number): Observable<any> {
        return this.http.get(`${this.apiUrl}informes-por-paciente/${id_paciente}`);
    }

    actualizarInforme(id: number, texto: string): Observable<any> {
        return this.http.post(`${this.apiUrl}actualizar-informe/${id}`, { texto });
    }

    createInformeIA(payload: GenerarInformeRequest): Observable<GenerarInformeResponse> {
      return this.http.post<GenerarInformeResponse>(`${this.apiUrl}generar-informe`, payload)
        .pipe(
          catchError(err => {
            console.error('❌ Error al generar informe:', err);
            return throwError(() => err);
          })
        );
    }
} 