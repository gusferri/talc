import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ChangePasswordDialogComponent } from '../../../shared/change-password/change-password-dialog.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  loginError = '';
  hidePassword = true;

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
            localStorage.setItem('email', respuesta.Email || '');
            localStorage.setItem('rol', (respuesta.Grupos && respuesta.Grupos.length > 0) ? respuesta.Grupos[0] : '');
            this.router.navigate(['/dashboard']);
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
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        alert('Error al cambiar la contraseña.');
      }
    });
  }
} 