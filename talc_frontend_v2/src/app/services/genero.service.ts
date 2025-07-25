import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class GeneroService {
    private apiUrl = `${environment.apiBaseUrl}/pacientes`;

    constructor(private http: HttpClient) {}

    buscarGeneros(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/buscarGeneros`);
    }
} 