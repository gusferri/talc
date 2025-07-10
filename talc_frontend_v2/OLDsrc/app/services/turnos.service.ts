import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Turno } from '../models/turno.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TurnosService {

  private apiUrl = 'http://192.168.2.41:8000/turnos/detalle';

  constructor(private http: HttpClient) {}

  obtenerTurnos(): Observable<Turno[]> {
    return this.http.get<Turno[]>(this.apiUrl);
  }

  actualizarEstadoTurno(turnoID: number, nuevoEstado: number) {
    return this.http.put(`http://192.168.2.41:8000/turnos/${turnoID}/estado`, { ID_EstadoTurno: nuevoEstado });
  }

  registrarAsistencia(turnoID: number) {
    return this.http.post(`http://192.168.2.41:8000/turnos/${turnoID}/asistencia`, {});
  }

  obtenerProfesionales() {
    return this.http.get<any[]>('http://192.168.2.41:8000/turnos/profesionales');
  }

  obtenerEspecialidadesPorProfesional(idProfesional: number) {
    return this.http.get<any[]>(`http://192.168.2.41:8000/turnos/especialidades-por-profesional/${idProfesional}`);
  }

  crearTurno(turno: any) {
    return this.http.post('http://192.168.2.41:8000/turnos', turno);
  }

  obtenerTurnoPorId(id: number) {
    return this.http.get<any>(`http://192.168.2.41:8000/turnos/${id}`);
  }

  actualizarTurno(id: number, turno: any) {
    return this.http.put(`http://192.168.2.41:8000/turnos/${id}`, turno);
  }
} 