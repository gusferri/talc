import {
  Component,
  ChangeDetectionStrategy,
  Inject,
  signal,
  LOCALE_ID,
} from '@angular/core';
import { CommonModule, DOCUMENT, NgSwitch } from '@angular/common';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import {
  MatDialog,
  MatDialogRef,
  MatDialogConfig,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormGroup,
} from '@angular/forms';
import { CalendarFormDialogComponent } from './calendar-form-dialog/calendar-form-dialog.component';
import {
  startOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours,
  subMonths,
  addMonths,
} from 'date-fns';
import { Subject } from 'rxjs';
import {
  CalendarDateFormatter,
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarModule,
  CalendarView,
} from 'angular-calendar';
import { MaterialModule } from 'src/app/material.module';
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TablerIconsModule } from 'angular-tabler-icons';

const colors: any = {
  red: {
    primary: '#fa896b',
    secondary: '#fdede8',
  },
  blue: {
    primary: '#5d87ff',
    secondary: '#ecf2ff',
  },
  yellow: {
    primary: '#ffae1f',
    secondary: '#fef5e5',
  },
};

@Component({
    selector: 'app-calendar-dialog',
    templateUrl: './dialog.component.html',
    imports: [
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        MatNativeDateModule,
        MatDialogModule,
        MatDatepickerModule,  TablerIconsModule
    ],
    providers: [provideNativeDateAdapter()],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarDialogComponent {
  options!: UntypedFormGroup;

  constructor(
    public dialogRef: MatDialogRef<CalendarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}

@Component({
    selector: 'app-fullcalendar',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './fullcalendar.component.html',
    imports: [
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        NgSwitch,
        CalendarModule,
        CommonModule,
        MatDatepickerModule,
        MatDialogModule,
        MatFormFieldModule,
    ],
    providers: [provideNativeDateAdapter(), CalendarDateFormatter, { provide: LOCALE_ID, useValue: 'es' }]
})
export class AppFullcalendarComponent {
  // Eliminadas referencias a dialogs y acciones de edición/eliminación
  view = signal<any>('month');
  viewDate = signal<Date>(new Date());
  activeDayIsOpen = signal<boolean>(true);

  refresh: Subject<any> = new Subject();

  // Solo eventos de ejemplo, sin acciones
  events = signal<CalendarEvent[] | any>([
    {
      start: subDays(startOfDay(new Date()), 1),
      end: addDays(new Date(), 1),
      title: 'A 3 day event',
      color: colors.red,
    },
    {
      start: startOfDay(new Date()),
      title: 'An event with no end date',
      color: colors.blue,
    },
    {
      start: subDays(endOfMonth(new Date()), 3),
      end: addDays(endOfMonth(new Date()), 3),
      title: 'A long event that spans 2 months',
      color: colors.blue,
    },
    {
      start: addHours(startOfDay(new Date()), 2),
      end: new Date(),
      title: 'A draggable and resizable event',
      color: colors.yellow,
    },
  ]);

  constructor(@Inject(DOCUMENT) doc: any) {}

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate())) {
      if (
        (isSameDay(this.viewDate(), date) && this.activeDayIsOpen() === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen.set(false);
      } else {
        this.activeDayIsOpen.set(true);
        this.viewDate.set(date);
      }
    }
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    this.events.set(
      this.events().map((iEvent: CalendarEvent<any>) => {
        if (iEvent === event) {
          return {
            ...event,
            start: newStart,
            end: newEnd,
          };
        }
        return iEvent;
      })
    );
  }

  setView(view: CalendarView | any): void {
    this.view.set(view);
  }

  goToPreviousMonth(): void {
    this.viewDate.set(subMonths(this.viewDate(), 1));
  }

  goToNextMonth(): void {
    this.viewDate.set(addMonths(this.viewDate(), 1));
  }

  goToToday() {
    this.viewDate.set(new Date());
  }
}
