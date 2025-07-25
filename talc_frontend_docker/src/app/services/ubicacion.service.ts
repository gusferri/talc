import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {
  private apiUrlBase = `${environment.apiBaseUrl}/pacientes`;

  constructor(private http: HttpClient) {}

  buscarProvincias(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrlBase}/buscarProvincias`, {
      params: { query }
    });
  }

  buscarCiudadesPorProvincia(idProvincia: number, query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrlBase}/buscarCiudadesPorProvincia`, {
      params: { id: idProvincia, query }
    });
  }
  

  obtenerProvincias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrlBase}/obtenerProvincias`);
  }

  obtenerCiudades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrlBase}/obtenerCiudades`);
  }
} 