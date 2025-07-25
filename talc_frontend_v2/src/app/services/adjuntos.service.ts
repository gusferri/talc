import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdjuntoBackend {
  ID: number;
  Nombre: string;
  Tipo: string;
  Fecha: string;
  Tamaño: number;
  URL?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdjuntosService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  obtenerAdjuntos(idPaciente: number): Observable<AdjuntoBackend[]> {
    return this.http.get<AdjuntoBackend[]>(`${this.baseUrl}/pacientes/adjuntos/${idPaciente}`).pipe(
      // Aquí podrías agregar manejo de errores si es necesario
    );
  }

  subirAdjunto(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/pacientes/adjuntos`, formData);
  }

  descargarAdjunto(documentoId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/pacientes/adjuntos/descargar/${documentoId}`, {
      responseType: 'blob'
    });
  }

  visualizarAdjunto(documentoId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/pacientes/adjuntos/visualizar/${documentoId}`, {
      responseType: 'blob'
    });
  }

  eliminarAdjunto(documentoId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/pacientes/adjuntos/${documentoId}`);
  }
} 