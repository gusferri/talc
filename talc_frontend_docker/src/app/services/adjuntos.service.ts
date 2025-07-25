import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Adjunto {
  id: number;
  titulo: string;
  fechaSubida: string;
  nombreArchivo: string;
  rutaArchivo: string;
  usuarioSubio: string;
  especialidad: string;
}

// Interface para los datos que vienen del backend
interface AdjuntoBackend {
  ID: number;
  Titulo: string;
  FechaSubida: string;
  NombreArchivo: string;
  RutaArchivo: string;
  UsuarioSubio: string;
  Especialidad: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdjuntosService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  // Obtener adjuntos de un paciente
  obtenerAdjuntosPaciente(idPaciente: number): Observable<Adjunto[]> {
    return this.http.get<AdjuntoBackend[]>(`${this.baseUrl}/pacientes/adjuntos/${idPaciente}`).pipe(
      map(adjuntosBackend => adjuntosBackend.map(adj => ({
        id: adj.ID,
        titulo: adj.Titulo,
        fechaSubida: adj.FechaSubida,
        nombreArchivo: adj.NombreArchivo,
        rutaArchivo: adj.RutaArchivo,
        usuarioSubio: adj.UsuarioSubio,
        especialidad: adj.Especialidad
      })))
    );
  }

  // Subir un nuevo adjunto
  subirAdjunto(
    archivo: File, 
    titulo: string, 
    idPaciente: number, 
    username: string, 
    idEspecialidad?: number
  ): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('titulo', titulo);
    formData.append('id_paciente', idPaciente.toString());
    formData.append('username', username);
    
    if (idEspecialidad) {
      formData.append('id_especialidad', idEspecialidad.toString());
    }

    return this.http.post(`${this.baseUrl}/pacientes/adjuntos`, formData);
  }

  // Descargar un adjunto
  descargarAdjunto(documentoId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/pacientes/adjuntos/descargar/${documentoId}`, {
      responseType: 'blob'
    });
  }

  // Obtener URL para visualizar un adjunto
  visualizarAdjunto(documentoId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/pacientes/adjuntos/visualizar/${documentoId}`, {
      responseType: 'blob'
    });
  }

  // Eliminar un adjunto
  eliminarAdjunto(documentoId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/pacientes/adjuntos/${documentoId}`);
  }

  // Método helper para crear URL de blob para visualización
  crearUrlVisualizacion(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  // Método helper para descargar blob
  descargarBlob(blob: Blob, nombreArchivo: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
} 