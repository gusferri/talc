import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class PacienteService {
    private apiUrl = 'http://192.168.2.41:8000/pacientes';
    constructor(private http: HttpClient) {}


    displayPaciente(paciente: any): string {
        return paciente ? `${paciente.Apellido}, ${paciente.Nombre}` : '';
    }

    obtenerTurnosPorPacienteFormateados(idPaciente: number): Observable<any[]> {
        return this.obtenerTurnosPorPaciente(idPaciente).pipe(
            map((turnos: any[]) =>
                turnos
                .filter(t => t.Fecha && t.Hora)
                .map(t => {
                    const startDateTime = new Date(`${t.Fecha}T${t.Hora.length === 5 ? t.Hora + ':00' : t.Hora}`);
                    const mostrarIconoNotaVoz = startDateTime < new Date();
                    return {
                        title: t.Especialidad ? `${t.Especialidad}` : 'Turno',
                        estado: t.EstadoTurno || '',
                        start: `${t.Fecha}T${t.Hora.length === 5 ? t.Hora + ':00' : t.Hora}`,
                        allDay: false,
                        cantidadNotasVoz: t.CantidadNotasVoz || 0,
                        mostrarIconoNotaVoz
                    };
                })
            )
        );
    }
    
    buscarPacientes(query: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/buscarPacientes`, {
            params: { query }
        });
    }
    insertarPaciente(paciente: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/grabarPaciente`, paciente);
    }

    actualizarPaciente(dni: any, paciente: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/actualizarPaciente/${dni}`, paciente);
    }

    adjuntarArchivo(formData: FormData): Observable<any> {
        return this.http.post(`${this.apiUrl}/adjuntos`, formData);
    }

    esProfesionalPorShortname(shortname: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/esProfesionalPorShortname?shortname=${shortname}`);
    }

    obtenerPacientesPorProfesional(shortname: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/profesional?shortname=${shortname}`);
    }

    obtenerTurnosPorPaciente(idPaciente: number): Observable<any[]> {
        const username = localStorage.getItem('username') || '';
        return this.http.get<any[]>(`${this.apiUrl}/turnosPorPaciente`, {
            params: {
                id_paciente: idPaciente,
                username
            }
        });
    }

    obtenerProfesionalPorUsername(username: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/obtenerProfesionalPorUsername`, {
            params: { username }
        });
    }

    obtenerTurnos(): Observable<any[]> {
        const username = localStorage.getItem('username') || '';
        return this.http.get<any[]>(`${this.apiUrl}/turnos`, {
            params: {
                username
            }
        });
    }
}