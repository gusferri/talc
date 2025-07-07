import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EscuelaService {
  private apiUrlBase = 'http://192.168.2.41:8000/pacientes';

  constructor(private http: HttpClient) {}

  buscarEscuelasPorCiudad(idCiudad: number, query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrlBase}/buscarEscuelasPorCiudad`, {
      params: { id: idCiudad, query }
    });
  }

  obtenerEscuelas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrlBase}/obtenerEscuelas`);
  }
} 