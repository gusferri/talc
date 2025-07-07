import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class GeneroService {
    private apiUrl = 'http://192.168.2.41:8000/pacientes';

    constructor(private http: HttpClient) {}

    obtenerGeneros(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/buscarGeneros`);
    }
}