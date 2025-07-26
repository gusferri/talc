import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Importaciones de servicios
import { AdminService, Usuario } from '../../../../services/admin.service';

/**
 * Interfaz para los datos del diálogo
 */
interface DialogData {
  modo: 'crear' | 'editar';
  usuario?: Usuario;
}

/**
 * Componente de diálogo para crear/editar usuarios
 */
@Component({
  selector: 'app-usuario-dialog',
  templateUrl: './usuario-dialog.component.html',
  styleUrls: ['./usuario-dialog.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, 
            MatInputModule, MatButtonModule, MatSelectModule, MatSlideToggleModule, 
            MatCardModule, MatIconModule, MatProgressSpinnerModule],
  standalone: true
})
export class UsuarioDialogComponent implements OnInit {
  // Formulario reactivo
  usuarioForm!: FormGroup;
  
  // Estados del componente
  isLoading: boolean = false;
  modo: 'crear' | 'editar' = 'crear';
  usuarioOriginal?: Usuario;

  // Opciones para roles
  roles: string[] = ['Administrador', 'Profesional', 'Secretaria'];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private dialogRef: MatDialogRef<UsuarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.modo = data.modo;
    this.usuarioOriginal = data.usuario;
  }

  ngOnInit(): void {
    this.inicializarFormulario();
    if (this.modo === 'editar' && this.usuarioOriginal) {
      this.cargarDatosUsuario();
    }
  }

  /**
   * Inicializa el formulario reactivo
   */
  inicializarFormulario(): void {
    this.usuarioForm = this.fb.group({
      Username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      NombreCompleto: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      Email: ['', [Validators.required, Validators.email]],
      Password: ['', this.modo === 'crear' ? [Validators.required, Validators.minLength(6)] : []],
      Rol: ['', Validators.required],
      Activo: [true]
    });
  }

  /**
   * Carga los datos del usuario para edición
   */
  cargarDatosUsuario(): void {
    if (this.usuarioOriginal) {
      this.usuarioForm.patchValue({
        Username: this.usuarioOriginal.Username,
        NombreCompleto: this.usuarioOriginal.NombreCompleto,
        Email: this.usuarioOriginal.Email,
        Rol: this.usuarioOriginal.Rol,
        Activo: this.usuarioOriginal.Activo
      });
    }
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getErrorMessage(campo: string): string {
    const control = this.usuarioForm.get(campo);
    
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    
    if (control?.hasError('email')) {
      return 'Ingrese un email válido';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    
    return '';
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.usuarioForm.valid) {
      this.isLoading = true;
      
      const datosUsuario = this.usuarioForm.value;
      
      if (this.modo === 'crear') {
        this.adminService.crearUsuario(datosUsuario).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('❌ Error al crear usuario:', error);
            this.isLoading = false;
          }
        });
      } else {
        if (this.usuarioOriginal) {
          // Si no se cambió la contraseña, no la enviamos
          if (!datosUsuario.Password) {
            delete datosUsuario.Password;
          }
          
          this.adminService.actualizarUsuario(this.usuarioOriginal.ID, datosUsuario).subscribe({
            next: (response) => {
              this.isLoading = false;
              this.dialogRef.close(true);
            },
            error: (error) => {
              console.error('❌ Error al actualizar usuario:', error);
              this.isLoading = false;
            }
          });
        }
      }
    }
  }

  /**
   * Cierra el diálogo sin guardar
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }
} 