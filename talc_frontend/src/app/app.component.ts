import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from './shared/sidebar/sidebar.component';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordDialogComponent } from './shared/change-password/change-password-dialog.component';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesDialogComponent } from './shared/notificaciones-dialog/notificaciones-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'talc-frontend';
  notificaciones: any[] = [];
  cantidadNoLeidas: number = 0;

  constructor(private router: Router, private dialog: MatDialog, private notificacionesService: NotificacionesService) {
  }

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    const idUsuario = Number(localStorage.getItem('idUsuario')) || 0;
    this.notificacionesService.obtenerNotificaciones().subscribe((notifs) => {
      this.notificaciones = notifs;
      this.cantidadNoLeidas = notifs.filter(n => !n.Leido).length;
    });
  }

  abrirNotificaciones(): void {
    this.dialog.open(NotificacionesDialogComponent, {
      width: '400px',
      data: { notificaciones: this.notificaciones }
    });
  }

  shouldShowToolbar(): boolean {
    return this.router.url !== '/login';
  }
  
  shouldShowSidebar(): boolean {
    return !(this.router.url === '/login' || this.router.url === '/menu-principal');
  }

  abrirDialogoCambioContrasena() {
    const idUsuario = Number(localStorage.getItem('idUsuario')) || 0;
    const username = localStorage.getItem('username') || '';

    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '400px',
      data: { idUsuario, username }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.router.navigate(['/login']);
      }
    });
  }

  cerrarSesion() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  get nombreUsuario(): string {
    const nombreCompleto = localStorage.getItem('nombreCompleto');
    const username = localStorage.getItem('username');
    console.log('Contenido de localStorage (nombreCompleto):', nombreCompleto);
    console.log('Contenido de localStorage (username):', username);
    return nombreCompleto || '';
  }
}