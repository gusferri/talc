import {
  Component,
  Output,
  EventEmitter,
  Input,
  signal,
  ViewEncapsulation,
  OnInit,
} from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog } from '@angular/material/dialog';
import { navItems } from '../sidebar/sidebar-data';
import { TranslateService } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AppSettings } from 'src/app/config';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { NotificacionesDialogComponent } from 'src/app/shared/notificaciones-dialog.component';
import { ChangePasswordDialogComponent } from 'src/app/shared/change-password/change-password-dialog.component';
import { filter } from 'rxjs/operators';

interface notifications {
  id: number;
  img: string;
  title: string;
  subtitle: string;
}







@Component({
  selector: 'app-header',
  imports: [
    RouterModule,
    CommonModule,
    NgScrollbarModule,
    TablerIconsModule,
    MaterialModule,
  ],
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();
  
  
  showFiller = false;

  @Output() optionsChange = new EventEmitter<AppSettings>();

  notificaciones: any[] = [];
  cantidadNoLeidas: number = 0;

  isTurnosRoute = false;

  constructor(
    private settings: CoreService,
    private vsidenav: CoreService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private notificacionesService: NotificacionesService,
    public router: Router
  ) {
    this.cargarNotificaciones();
  }

  ngOnInit(): void {
    this.checkTurnosRoute();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.checkTurnosRoute();
    });
  }

  options = this.settings.getOptions();
  
  nombreCompleto = localStorage.getItem('nombreCompleto') || '';
  rol = localStorage.getItem('rol') || '';
  email = localStorage.getItem('email') || '';

  openDialog() {
    const dialogRef = this.dialog.open(AppSearchDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

  setlightDark(theme: string) {
    this.options.theme =theme;
    this.emitOptions();
    
  }

  private emitOptions() {
    this.optionsChange.emit(this.options);
  }

  notifications: notifications[] = [
    {
      id: 1,
      img: '/assets/images/profile/user-1.jpg',
      title: 'Roman Joined the Team!',
      subtitle: 'Congratulate him sf',
    },
    {
      id: 2,
      img: '/assets/images/profile/user-2.jpg',
      title: 'New message received',
      subtitle: 'Salma sent you new message',
    },
    {
      id: 3,
      img: '/assets/images/profile/user-3.jpg',
      title: 'New Payment received',
      subtitle: 'Check your earnings',
    },
    {
      id: 4,
      img: '/assets/images/profile/user-4.jpg',
      title: 'Jolly completed tasks',
      subtitle: 'Assign her new tasks',
    },
    {
      id: 5,
      img: '/assets/images/profile/user-5.jpg',
      title: 'Roman Joined thed Team!',
      subtitle: 'Congratulate him',
    },
  ];







  openChangePasswordDialog() {
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '400px',
      disableClose: false,
      data: { idUsuario: null } // Para cambio voluntario, no obligatorio
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Contraseña cambiada exitosamente');
        // Aquí podrías mostrar un mensaje de éxito
      }
    });
  }

  logout() {
    localStorage.clear();
    window.location.href = '/authentication/login';
  }

  cargarNotificaciones() {
    const username = localStorage.getItem('username') || '';
    this.notificacionesService.obtenerNotificaciones(username).subscribe((notis: any[]) => {
      // Filtrar solo no leídas
      this.notificaciones = notis.filter(n => !n.Leido);
      this.cantidadNoLeidas = this.notificaciones.length;
    });
  }

  abrirNotificaciones() {
    const dialogRef = this.dialog.open(NotificacionesDialogComponent, {
      data: { notificaciones: this.notificaciones },
      width: '400px',
      disableClose: false
    });
    dialogRef.afterClosed().subscribe(result => {
      // Al cerrar el diálogo, recargar notificaciones para actualizar el badge
      this.cargarNotificaciones();
    });
  }

  checkTurnosRoute() {
    this.isTurnosRoute = this.router.url.includes('/turnos');
  }
}

@Component({
  selector: 'search-dialog',
  imports: [RouterModule, MaterialModule, TablerIconsModule, FormsModule],
  templateUrl: 'search-dialog.component.html',
})
export class AppSearchDialogComponent {
  searchText: string = '';
  navItems = navItems;

  navItemsData = navItems.filter((navitem) => navitem.displayName);

  // filtered = this.navItemsData.find((obj) => {
  //   return obj.displayName == this.searchinput;
  // });
}
