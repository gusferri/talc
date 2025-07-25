import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Turno } from '../models/turno.model';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TurnosService {

  private apiUrl = `${environment.apiBaseUrl}/turnos/detalle`;

  constructor(private http: HttpClient) {}

  obtenerTurnos(): Observable<Turno[]> {
    return this.http.get<Turno[]>(this.apiUrl);
  }

  actualizarEstadoTurno(turnoID: number, nuevoEstado: number) {
    return this.http.put(`${environment.apiBaseUrl}/turnos/${turnoID}/estado`, { ID_EstadoTurno: nuevoEstado });
  }

  registrarAsistencia(turnoID: number) {
    return this.http.post(`${environment.apiBaseUrl}/turnos/${turnoID}/asistencia`, {});
  }

  obtenerProfesionales() {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/turnos/profesionales`);
  }

  obtenerEspecialidadesPorProfesional(idProfesional: number) {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/turnos/especialidades-por-profesional/${idProfesional}`);
  }

  crearTurno(turno: any) {
    return this.http.post(`${environment.apiBaseUrl}/turnos`, turno);
  }

  obtenerTurnoPorId(id: number) {
    return this.http.get<any>(`${environment.apiBaseUrl}/pacientes/turno/${id}`);
  }

  actualizarTurno(id: number, turno: any) {
    return this.http.put(`${environment.apiBaseUrl}/turnos/${id}`, turno);
  }
} 