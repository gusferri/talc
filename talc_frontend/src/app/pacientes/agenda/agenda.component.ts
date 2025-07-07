import { Component, inject, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { PacienteService } from '../paciente.service';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { CalendarOptions } from '@fullcalendar/core';


@Component({

  encapsulation: ViewEncapsulation.None,
  selector: 'app-agenda',
  standalone: true,
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
    FullCalendarModule
  ],
  providers: [PacienteService]
})
export class AgendaComponent {
  username: string = localStorage.getItem('username') || '';
  pacienteControl = new FormControl('');
  pacientesFiltrados: any[] = [];
  eventosCalendario: any[] = [];
calendarOptionsReady = false;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    nowIndicator: true,
    locale: esLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    slotMinTime: '08:00:00',
    slotMaxTime: '21:00:00',
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    weekends: false,
    allDaySlot: false,
    events: [],
    eventContent: function(arg) {
      const especialidad = arg.event.title;
      const estado = arg.event.extendedProps['estado'];
      const tieneNotaVoz = arg.event.extendedProps['tieneNotaVoz'];
      const mostrarIconoNotaVoz = arg.event.extendedProps['mostrarIconoNotaVoz'];
      let micIcon = '';
      if (mostrarIconoNotaVoz) {
        micIcon = tieneNotaVoz
          ? `<span style="position: absolute; top: 2px; right: 4px; font-size: 15px;">🎤</span>`
          : `<span style="position: absolute; top: 2px; right: 4px; font-size: 15px; color: #e53935;">❌</span>`;
      }
      return {
        html: `<div style="position:relative;">
                ${micIcon}
                <div><b>${especialidad}</b></div>
                <div style="font-size: 12px; color: #fff; opacity: 0.85;">${estado}</div>
              </div>`
      };
    }
  };

  private pacienteService = inject(PacienteService);

  constructor() {
    const shortname = localStorage.getItem('username');
    let pacientesProfesional: any[] = [];

    if (shortname) {
      this.pacienteService.obtenerPacientesPorProfesional(shortname).subscribe((pacientes: any[]) => {
        pacientesProfesional = pacientes;
      });

      this.pacienteService.obtenerTurnos().subscribe((turnos: any[]) => {
        this.eventosCalendario = turnos
          .filter(t => t.Fecha && t.Hora)
          .map(t => {
            const startDateTime = new Date(`${t.Fecha}T${t.Hora.length === 5 ? t.Hora + ':00' : t.Hora}`);
            const mostrarIconoNotaVoz = startDateTime < new Date();
            const tieneNotaVoz = !!t.ID_NotaVoz;
            return {
              title: `${t.NombrePaciente} ${t.ApellidoPaciente} - [${t.Especialidad}]`,
              estado: t.EstadoTurno || '',
              start: `${t.Fecha}T${t.Hora.length === 5 ? t.Hora + ':00' : t.Hora}`,
              allDay: false,
              tieneNotaVoz,
              mostrarIconoNotaVoz
            };
          });
        this.calendarOptions.events = this.eventosCalendario;
      });
    }

    this.pacienteControl.valueChanges
      .pipe(
        debounceTime(300),
        switchMap(value => {
          if (typeof value === 'string' && value.length > 1) {
            // Filtra solo sobre los pacientes de la profesional
            const filtro = value.toLowerCase();
            return of(
              pacientesProfesional.filter(p =>
                (`${p.Nombre} ${p.Apellido}`.toLowerCase().includes(filtro) ||
                `${p.Apellido} ${p.Nombre}`.toLowerCase().includes(filtro))
              )
            );
          } else {
            return of([]);
          }
        })
      )
    .subscribe((pacientes: any[]) => {
      this.pacientesFiltrados = pacientes;
    });
  }

  seleccionarPaciente(paciente: any): void {
    if (paciente) {
      this.pacienteControl.setValue(paciente);
      this.pacienteService.obtenerTurnosPorPaciente(paciente.ID).subscribe((turnos: any[]) => {
        this.eventosCalendario = turnos
          .filter(t => t.Fecha && t.Hora)
          .map(t => {
            const startDateTime = new Date(`${t.Fecha}T${t.Hora.length === 5 ? t.Hora + ':00' : t.Hora}`);
            const mostrarIconoNotaVoz = startDateTime < new Date();
            const tieneNotaVoz = !!t.ID_NotaVoz;
            return {
              title: t.Especialidad ? `${t.Especialidad}` : 'Turno',
              estado: t.EstadoTurno || '',
              start: `${t.Fecha}T${t.Hora.length === 5 ? t.Hora + ':00' : t.Hora}`,
              allDay: false,
              tieneNotaVoz,
              mostrarIconoNotaVoz
            };
          });
        this.calendarOptions.events = this.eventosCalendario;
      });
    }
  }

  displayPaciente(paciente: any): string {
    return paciente ? `${paciente.Apellido}, ${paciente.Nombre}` : '';
  }
}