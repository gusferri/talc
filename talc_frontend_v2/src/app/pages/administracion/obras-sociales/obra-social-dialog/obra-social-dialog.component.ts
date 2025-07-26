/**
 * Componente de Diálogo para Obras Sociales - Crear/Editar obras sociales
 * 
 * Este componente proporciona un formulario modal para crear nuevas obras sociales
 * o editar obras sociales existentes en el sistema TALC.
 * 
 * Funcionalidades principales:
 * - Formulario para crear nueva obra social
 * - Formulario para editar obra social existente
 * - Validación de campos requeridos
 * - Integración con el servicio de administración
 * 
 * Responsabilidades:
 * - Gestionar el estado del formulario
 * - Validar datos antes de enviar
 * - Comunicar resultados al componente padre
 * - Manejar errores de validación
 */

import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// Importaciones de servicios
import { AdminService, ObraSocial } from '../../../../services/admin.service';

/**
 * Interfaz para los datos del diálogo
 */
interface DialogData {
  modo: 'crear' | 'editar';
  obraSocial?: ObraSocial;
}

/**
 * Componente de diálogo para obras sociales
 */
@Component({
  selector: 'app-obra-social-dialog',
  templateUrl: './obra-social-dialog.component.html',
  styleUrls: ['./obra-social-dialog.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  standalone: true
})
export class ObraSocialDialogComponent implements OnInit {
  // Formulario reactivo
  obraSocialForm!: FormGroup;
  
  // Estado del componente
  isLoading = false;
  isSubmitting = false;
  
  // Título del diálogo
  dialogTitle = '';
  submitButtonText = '';

  /**
   * Constructor del componente
   */
  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<ObraSocialDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Método que se ejecuta al inicializar el componente
   */
  ngOnInit(): void {
    this.inicializarFormulario();
    this.configurarDialogo();
  }

  /**
   * Inicializa el formulario reactivo
   */
  inicializarFormulario(): void {
    this.obraSocialForm = this.formBuilder.group({
      Nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      Descripcion: ['', [Validators.maxLength(500)]]
    });

    // Si es modo editar, cargar datos existentes
    if (this.data.modo === 'editar' && this.data.obraSocial) {
      this.obraSocialForm.patchValue({
        Nombre: this.data.obraSocial.Nombre,
        Descripcion: this.data.obraSocial.Descripcion || ''
      });
    }
  }

  /**
   * Configura el título y texto del botón según el modo
   */
  configurarDialogo(): void {
    if (this.data.modo === 'crear') {
      this.dialogTitle = 'Nueva Obra Social';
      this.submitButtonText = 'Crear';
    } else {
      this.dialogTitle = 'Editar Obra Social';
      this.submitButtonText = 'Actualizar';
    }
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.obraSocialForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formData = this.obraSocialForm.value;
      
      if (this.data.modo === 'crear') {
        this.crearObraSocial(formData);
      } else {
        this.actualizarObraSocial(formData);
      }
    } else {
      this.marcarCamposComoTocados();
    }
  }

  /**
   * Crea una nueva obra social
   */
  crearObraSocial(formData: any): void {
    this.adminService.crearObraSocial(formData).subscribe({
      next: (obraSocial) => {
        console.log('🏥 Obra social creada:', obraSocial);
        this.dialogRef.close(obraSocial);
        this.mostrarNotificacion('Obra social creada exitosamente', 'success');
      },
      error: (error) => {
        console.error('❌ Error al crear obra social:', error);
        this.mostrarNotificacion('Error al crear la obra social', 'error');
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Actualiza una obra social existente
   */
  actualizarObraSocial(formData: any): void {
    if (!this.data.obraSocial) {
      this.mostrarNotificacion('Error: No se encontró la obra social a editar', 'error');
      this.isSubmitting = false;
      return;
    }

    this.adminService.actualizarObraSocial(this.data.obraSocial.ID, formData).subscribe({
      next: (obraSocial) => {
        console.log('🏥 Obra social actualizada:', obraSocial);
        this.dialogRef.close(obraSocial);
        this.mostrarNotificacion('Obra social actualizada exitosamente', 'success');
      },
      error: (error) => {
        console.error('❌ Error al actualizar obra social:', error);
        this.mostrarNotificacion('Error al actualizar la obra social', 'error');
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Cierra el diálogo sin guardar
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Marca todos los campos como tocados para mostrar errores
   */
  marcarCamposComoTocados(): void {
    Object.keys(this.obraSocialForm.controls).forEach(key => {
      const control = this.obraSocialForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Verifica si un campo tiene errores
   */
  tieneError(campo: string): boolean {
    const control = this.obraSocialForm.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Obtiene el mensaje de error para un campo
   */
  obtenerMensajeError(campo: string): string {
    const control = this.obraSocialForm.get(campo);
    
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
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
   * Muestra una notificación
   */
  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: tipo === 'success' ? ['success-snackbar'] : ['error-snackbar']
    });
  }
} 