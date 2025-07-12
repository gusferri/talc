import { Component } from '@angular/core';
import { AppFullcalendarComponent } from './calendario-modernize/fullcalendar.component';
import { MatNativeDateModule } from '@angular/material/core';
import { CalendarModule } from 'angular-calendar';

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
export class CalendarioComponent {} 