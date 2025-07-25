import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  encapsulation: ViewEncapsulation.None
})
export class ChangePasswordDialogComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  username: string = '';
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.username = data?.username || localStorage.getItem('username') || '';
  }

  guardar() {
    if (this.newPassword !== this.confirmPassword) {
      alert('Las contraseñas nuevas no coinciden');
      return;
    }

    if (!this.currentPassword || !this.newPassword) {
      alert('Todos los campos son obligatorios');
      return;
    }

    if (!this.username) {
      alert('Error: Usuario no identificado');
      return;
    }

    const payload = {
      username: this.username,
      contrasena_actual: this.currentPassword,
      nueva_contrasena: this.newPassword
    };
    console.log('Payload enviado al backend:', payload);

    this.http.post(`${environment.apiBaseUrl}/cambiar-contrasena`, payload, {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: (response: any) => {
        this.snackBar.open('Contraseña actualizada exitosamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });

        setTimeout(() => {
          localStorage.clear();
          this.dialogRef.close(true);
          window.location.href = '/login';
        }, 1000);
      },
      error: (err) => {
        console.error(err);
        alert('Error al actualizar la contraseña');
      }
    });
  }

  cancelar() {
    this.dialogRef.close(null);
  }
} 