import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordDialogComponent } from '../shared/change-password/change-password-dialog.component';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule, HttpClientModule]
})
export class LoginComponent {
  username = '';
  password = '';
  loginError = '';

  constructor(private router: Router, private http: HttpClient, private dialog: MatDialog) {}

  login() {
    if (this.username && this.password) {
      this.http.post<any>('http://192.168.2.41:8000/login', {
        username: this.username,
        password: this.password
      }).subscribe({
        next: (respuesta) => {
          if (respuesta.DebeCambiarContrasena) {
            const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
              width: '400px',
              disableClose: true,
              data: { idUsuario: respuesta.ID }
            });

            dialogRef.afterClosed().subscribe(result => {
              if (result) {
                this.actualizarContrasena(result.currentPassword, result.newPassword);
              }
            });
          } else {
            localStorage.setItem('nombreCompleto', `${respuesta.Nombre} ${respuesta.Apellido}`);
            localStorage.setItem('username', respuesta.Username);
            localStorage.setItem('usuario', 'true');
            this.router.navigate(['/menu-principal']);
          }
        },
        error: () => {
          this.loginError = 'Usuario o contraseña incorrectos';
        }
      });
    } else {
      this.loginError = 'Debe ingresar usuario y contraseña';
    }
  }

  actualizarContrasena(currentPassword: string, newPassword: string) {
    this.http.post('http://192.168.2.41:8000/cambiar-contrasena', {
      currentPassword: currentPassword,
      newPassword: newPassword
    }).subscribe({
      next: () => {
        this.router.navigate(['/menu-principal']);
      },
      error: () => {
        alert('Error al cambiar la contraseña.');
      }
    });
  }
}