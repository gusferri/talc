import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarModule } from '@fullcalendar/angular';
import { HttpClient } from '@angular/common/http';
import timeGridPlugin from '@fullcalendar/timegrid';
import { MatDialog } from '@angular/material/dialog';
import { TurnoDialogComponent } from '../turno-dialog/turno-dialog.component';
import { Router } from '@angular/router';
import { TurnosService } from '../../turnos/services/turnos.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule,FullCalendarModule, FormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.css'],
  encapsulation: ViewEncapsulation.None  // 👈 esta línea activa estilos globales
})
export class CalendarioComponent implements OnInit {

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
    //weekends: false,
    allDaySlot: false,
    events: []
  };

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private router: Router,
    private turnosService: TurnosService
  ) {}

  ngOnInit(): void {
    this.http.get<any[]>('http://192.168.2.41:8000/turnos/detalle').subscribe(data => {
      console.log('Datos cargados desde el backend:', data);

      const eventos = data
        .filter(turno => turno["Estado"] !== 'Cancelado')
        .map(turno => {
        const startDate = new Date(`${turno.Fecha}T${turno.Hora}`);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1); // duración del turno: 1 hora

        const turnoPasado = endDate < new Date();
        if (turnoPasado && turno["Estado"] !== 'Cancelado' && turno["Estado"] !== 'Ausente' && turno["Estado"] !== 'Asistido') {
          this.turnosService.actualizarEstadoTurno(turno.ID, 4).subscribe({
            next: () => {
              console.log(`✅ Turno ${turno.ID} marcado como Ausente.`);
              turno.Estado = 'Ausente'; // actualizar localmente el estado
            },
            //error: err => console.error(`❌ Error al marcar el turno ${turno.ID} como Ausente:`, err)
          });
        }
        let color = '#3788d8';
        
        if (turno.Estado === 'Asistido') {
          // Aplicar una versión atenuada del color original
          color += '80'; // Añadir opacidad al color (formato RGBA hexadecimal)
        }

        return {
          title: `${turno.Paciente} - [${turno.Especialidad}] ${turno.Profesional}`,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          //color: color,
          id: turno.ID,
          //className: turnoPasado ? 'pasado' : '',
          className: turnoPasado ? 'pasado' : `especialidad-${turno.Especialidad.replace(/\s+/g, '-').toLowerCase()}`, // Clase personalizada
          extendedProps: {
            ID: turno.ID,
            Paciente: turno.Paciente,
            Profesional: turno.Profesional,
            Especialidad: turno.Especialidad,
            Fecha: turno.Fecha,
            Hora: turno.Hora,
            Estado: turno.Estado
          }
        };
      });

      this.calendarOptions = {
        ...this.calendarOptions,
        eventDidMount: function(info) {
          const titleElement = info.el.querySelector('.fc-event-title');
          if (titleElement) {
            titleElement.textContent = '';  // limpiar contenido previo
            const partes = info.event.title.split(' - ');
            if (partes.length === 2) {
              const paciente = partes[0];
              const resto = partes[1];

              const pacienteNode = document.createElement('div');
              pacienteNode.textContent = paciente;

              const restoNode = document.createElement('div');
              restoNode.textContent = resto;

              titleElement.appendChild(pacienteNode);
              titleElement.appendChild(restoNode);
            } else {
              titleElement.textContent = info.event.title;
            }
          }
          // Si el estado es "Asistido", agregar un tilde
          if (info.event.extendedProps['Estado'] === 'Asistido') {
            const tilde = document.createElement('span');
            tilde.textContent = '✅';
            tilde.style.position = 'absolute';
            tilde.style.top = '2px';
            tilde.style.right = '2px';
            tilde.style.fontSize = '14px';
            tilde.style.zIndex = '10';
            info.el.appendChild(tilde);
          }
        },
        eventClick: (info) => {
          const turno = info.event;
          const estado = turno.extendedProps['Estado'];

          // Si el turno está cancelado, no hacer nada
          if (estado === 'Asistido') {
            return;
          }

          const turnoID = turno.extendedProps['ID'];
          const fecha = turno.extendedProps['Fecha'];
          const hora = turno.extendedProps['Hora'];

          const fechaHoraTurno = new Date(`${fecha}T${hora}`);
          const ahora = new Date();

          // Se permite abrir el diálogo incluso si el turno ya pasó

          const dialogRef = this.dialog.open(TurnoDialogComponent, {
            data: {
              title: turno.title,
              turnoID: turnoID,
              paciente: turno.extendedProps['Paciente'],
              especialidad: turno.extendedProps['Especialidad'],
              profesional: turno.extendedProps['Profesional'],
              fecha: fecha,
              hora: hora.substring(0, 5)
            }
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result === 'editar') {
              this.router.navigate(['/turnos/nuevo'], {
                queryParams: {
                  turnoID: turnoID
                }
              });
            }
          });
        },
        events: eventos
      };
      this.calendarOptionsReady = true;
    });
  }
}