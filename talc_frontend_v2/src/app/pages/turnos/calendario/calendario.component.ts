import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarModule, CalendarView } from 'angular-calendar';
import { startOfDay } from 'date-fns';

@Component({
  selector: 'app-calendario',
  standalone: true,
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.scss'],
  imports: [CommonModule, CalendarModule]
})
export class CalendarioComponent {
  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();
  events = [
    {
      start: startOfDay(new Date()),
      title: 'Evento de ejemplo',
    },
  ];
  CalendarView = CalendarView;
} 