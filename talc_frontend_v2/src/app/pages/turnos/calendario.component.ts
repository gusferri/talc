import { Component, OnInit } from '@angular/core';
import { AppFullcalendarComponent } from './calendario-modernize/fullcalendar.component';
import { MatNativeDateModule } from '@angular/material/core';
import { CalendarModule, CalendarEvent } from 'angular-calendar';
import { TurnosService } from '../../services/turnos.service';
import { Turno } from '../../models/turno.model';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [
    CalendarModule,
    AppFullcalendarComponent,
    MatNativeDateModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.scss']
})
export class CalendarioComponent implements OnInit {
  eventos: CalendarEvent[] = [];
  eventosFiltrados: CalendarEvent[] = [];
  searchTerm: string = '';

  constructor(private turnosService: TurnosService) {}

  ngOnInit(): void {
    this.turnosService.obtenerTurnos().subscribe(turnos => {
      this.eventos = turnos.map(turno => this.turnoToEvent(turno));
      this.filtrarEventos();
    });
  }

  filtrarEventos(): void {
    const filtro = this.normalizarTexto(this.searchTerm);
    if (!filtro) {
      this.eventosFiltrados = this.eventos;
      return;
    }
    this.eventosFiltrados = this.eventos.filter(ev => {
      const paciente = this.normalizarTexto(ev.meta?.Paciente || '');
      return paciente.includes(filtro);
    });
  }

  normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quita tildes
      .replace(/\s+/g, ' ')
      .trim();
  }

  turnoToEvent(turno: Turno): CalendarEvent {
    const start = new Date(`${turno.Fecha}T${turno.Hora}`);
    const end = new Date(start);
    end.setHours(end.getHours() + 1); // Asume duración 1 hora
    const hora = turno.Hora.slice(0, 5); // Formato HH:MM
    return {
      start,
      end,
      title: `${hora} | ${turno.Paciente}<br>[${turno.Especialidad}] ${turno.Profesional}`,
      color: { primary: '#aa262b', secondary: '#f8d7da' },
      meta: turno
    };
  }
} 