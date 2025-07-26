import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Importaciones de servicios
import { AdminService, Especialidad } from '../../../../services/admin.service';

/**
 * Interfaz para los datos del diálogo
 */
interface DialogData {
  modo: 'crear' | 'editar';
  especialidad?: Especialidad;
}

/**
 * Componente de diálogo para crear/editar especialidades
 */
@Component({
  selector: 'app-especialidad-dialog',
  templateUrl: './especialidad-dialog.component.html',
  styleUrls: ['./especialidad-dialog.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, 
            MatInputModule, MatButtonModule, MatIconModule, MatCardModule, 
            MatProgressSpinnerModule, MatSnackBarModule],
  standalone: true
})
export class EspecialidadDialogComponent implements OnInit {
  // Formulario reactivo
  especialidadForm!: FormGroup;

  // Estado del componente
  isLoading = false;
  isEditMode = false;
  especialidadOriginal?: Especialidad;

  /**
   * Constructor del componente
   */
  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<EspecialidadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {
    this.isEditMode = data.modo === 'editar';
    this.especialidadOriginal = data.especialidad;
  }

  /**
   * Método que se ejecuta al inicializar el componente
   */
  ngOnInit(): void {
    this.inicializarFormulario();
    
    if (this.isEditMode && this.especialidadOriginal) {
      this.cargarDatosEspecialidad();
    }
  }

  /**
   * Inicializa el formulario reactivo
   */
  inicializarFormulario(): void {
    this.especialidadForm = this.formBuilder.group({
      Nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      Descripcion: ['', [Validators.maxLength(500)]]
    });
  }

  /**
   * Carga los datos de la especialidad en el formulario (modo edición)
   */
  cargarDatosEspecialidad(): void {
    if (this.especialidadOriginal) {
      this.especialidadForm.patchValue({
        Nombre: this.especialidadOriginal.Nombre,
        Descripcion: this.especialidadOriginal.Descripcion || ''
      });
    }
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.especialidadForm.valid) {
      this.isLoading = true;
      
      const datosEspecialidad = this.especialidadForm.value;
      
      if (this.isEditMode && this.especialidadOriginal) {
        // Modo edición
        this.adminService.actualizarEspecialidad(this.especialidadOriginal.ID_Especialidad, datosEspecialidad).subscribe({
          next: (especialidadActualizada) => {
            this.dialogRef.close(especialidadActualizada);
            this.mostrarNotificacion('Especialidad actualizada exitosamente', 'success');
          },
          error: (error) => {
            console.error('❌ Error al actualizar especialidad:', error);
            this.mostrarNotificacion('Error al actualizar la especialidad', 'error');
            this.isLoading = false;
          }
        });
      } else {
        // Modo creación
        this.adminService.crearEspecialidad(datosEspecialidad).subscribe({
          next: (nuevaEspecialidad) => {
            this.dialogRef.close(nuevaEspecialidad);
            this.mostrarNotificacion('Especialidad creada exitosamente', 'success');
          },
          error: (error) => {
            console.error('❌ Error al crear especialidad:', error);
            this.mostrarNotificacion('Error al crear la especialidad', 'error');
            this.isLoading = false;
          }
        });
      }
    } else {
      this.marcarCamposInvalidos();
    }
  }

  /**
   * Marca todos los campos inválidos como tocados para mostrar errores
   */
  marcarCamposInvalidos(): void {
    Object.keys(this.especialidadForm.controls).forEach(key => {
      const control = this.especialidadForm.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }

  /**
   * Maneja la cancelación del diálogo
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Muestra una notificación al usuario
   */
  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: tipo === 'success' ? 'success-snackbar' : 'error-snackbar'
    });
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getErrorMessage(campo: string): string {
    const control = this.especialidadForm.get(campo);
    
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    
    if (control?.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    
    return '';
  }

  /**
   * Verifica si un campo es inválido y ha sido tocado
   */
  isFieldInvalid(campo: string): boolean {
    const control = this.especialidadForm.get(campo);
    return !!(control?.invalid && control?.touched);
  }
} 