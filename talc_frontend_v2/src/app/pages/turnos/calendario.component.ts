/**
 * Componente Calendario - Visualización de turnos en formato calendario
 *
 * Este componente permite visualizar los turnos del sistema TALC
 * en un formato de calendario interactivo, incluyendo:
 * - Vista de calendario con eventos de turnos
 * - Filtrado por nombre de paciente
 * - Conversión automática de turnos a eventos de calendario
 * - Integración con angular-calendar
 * - Búsqueda en tiempo real
 *
 * Funcionalidades principales:
 * - Carga de turnos desde el servicio
 * - Transformación de datos de turnos a eventos de calendario
 * - Filtrado dinámico por paciente
 * - Normalización de texto para búsquedas
 * - Visualización con colores corporativos
 *
 * Arquitectura:
 * - Componente standalone con angular-calendar
 * - Integración con Material Design
 * - Manejo reactivo de filtros y eventos
 * - Conversión de datos entre modelos
 */

// Importaciones de Angular y librerías de calendario
import { Component, OnInit } from '@angular/core';
import { AppFullcalendarComponent } from './calendario-modernize/fullcalendar.component';
import { MatNativeDateModule } from '@angular/material/core';
import { CalendarModule, CalendarEvent } from 'angular-calendar';

// Servicios y modelos
import { TurnosService } from '../../services/turnos.service';
import { Turno } from '../../models/turno.model';

// Módulos de formularios y Material Design
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

/**
 * Componente principal de calendario de turnos
 */
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
  /** Lista completa de eventos de calendario */
  eventos: CalendarEvent[] = [];
  /** Lista filtrada de eventos según el término de búsqueda */
  eventosFiltrados: CalendarEvent[] = [];
  /** Término de búsqueda para filtrar eventos */
  searchTerm: string = '';

  /**
   * Constructor: inicializa el servicio de turnos
   */
  constructor(private turnosService: TurnosService) {}

  /**
   * Hook de inicialización: carga los turnos y los convierte a eventos
   */
  ngOnInit(): void {
    // Obtiene todos los turnos y los convierte a eventos de calendario
    this.turnosService.obtenerTurnos().subscribe(turnos => {
      this.eventos = turnos.map(turno => this.turnoToEvent(turno));
      this.filtrarEventos();
    });
  }

  /**
   * Filtra los eventos según el término de búsqueda
   * Aplica el filtro al nombre del paciente
   */
  filtrarEventos(): void {
    const filtro = this.normalizarTexto(this.searchTerm);
    if (!filtro) {
      // Si no hay filtro, muestra todos los eventos
      this.eventosFiltrados = this.eventos;
      return;
    }
    // Filtra eventos que contengan el término en el nombre del paciente
    this.eventosFiltrados = this.eventos.filter(ev => {
      const paciente = this.normalizarTexto(ev.meta?.Paciente || '');
      return paciente.includes(filtro);
    });
  }

  /**
   * Normaliza un texto para búsquedas
   * Convierte a minúsculas, quita tildes y espacios extra
   * 
   * @param texto - Texto a normalizar
   * @returns Texto normalizado para búsqueda
   */
  normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()                                    // Convierte a minúsculas
      .normalize('NFD')                                 // Normaliza caracteres Unicode
      .replace(/[\u0300-\u036f]/g, '')                 // Quita tildes y diacríticos
      .replace(/\s+/g, ' ')                            // Reemplaza múltiples espacios por uno
      .trim();                                         // Elimina espacios al inicio y final
  }

  /**
   * Convierte un turno en un evento de calendario
   * Crea un evento con fecha, hora, título y colores corporativos
   * 
   * @param turno - Turno a convertir
   * @returns Evento de calendario formateado
   */
  turnoToEvent(turno: Turno): CalendarEvent {
    // Crea la fecha de inicio combinando fecha y hora
    const start = new Date(`${turno.Fecha}T${turno.Hora}`);
    // Crea la fecha de fin (1 hora después)
    const end = new Date(start);
    end.setHours(end.getHours() + 1);                   // Duración de 1 hora por defecto
    
    // Formatea la hora para mostrar solo HH:MM
    const hora = turno.Hora.slice(0, 5);
    
    // Retorna el evento con formato personalizado
    return {
      start,                                            // Fecha y hora de inicio
      end,                                              // Fecha y hora de fin
      title: `${hora} | ${turno.Paciente}<br>[${turno.Especialidad}] ${turno.Profesional}`,  // Título con HTML
      color: { primary: '#aa262b', secondary: '#f8d7da' },  // Colores corporativos TALC
      meta: turno                                       // Datos originales del turno
    };
  }
} 