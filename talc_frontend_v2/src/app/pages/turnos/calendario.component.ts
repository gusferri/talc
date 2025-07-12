import { Component, OnInit } from '@angular/core';
import { AppFullcalendarComponent } from './calendario-modernize/fullcalendar.component';
import { MatNativeDateModule } from '@angular/material/core';
import { CalendarModule, CalendarEvent } from 'angular-calendar';
import { TurnosService } from '../../services/turnos.service';
import { Turno } from '../../models/turno.model';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [
    CalendarModule,
    AppFullcalendarComponent,
    MatNativeDateModule
  ],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.scss']
})
export class CalendarioComponent implements OnInit {
  eventos: CalendarEvent[] = [];

  constructor(private turnosService: TurnosService) {}

  ngOnInit(): void {
    this.turnosService.obtenerTurnos().subscribe(turnos => {
      this.eventos = turnos.map(turno => this.turnoToEvent(turno));
    });
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