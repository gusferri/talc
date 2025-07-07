import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {
  private apiUrlBase = 'http://192.168.2.41:8000/pacientes';

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