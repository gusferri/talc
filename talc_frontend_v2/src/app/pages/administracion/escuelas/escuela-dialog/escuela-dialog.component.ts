/**
 * Componente EscuelaDialog - Diálogo para crear/editar escuelas
 * 
 * Este componente proporciona un formulario modal para crear nuevas escuelas
 * o editar escuelas existentes en el sistema TALC.
 * 
 * Funcionalidades principales:
 * - Formulario reactivo para datos de escuela
 * - Validación de campos obligatorios
 * - Integración con ciudades y provincias
 * - Manejo de errores y notificaciones
 * 
 * Responsabilidades:
 * - Gestionar el estado del formulario
 * - Validar datos antes de enviar
 * - Comunicar resultados al componente padre
 * - Proporcionar interfaz de usuario intuitiva
 */

import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// Importaciones de servicios
import { AdminService, Escuela } from '../../../../services/admin.service';

/**
 * Interfaz para los datos del diálogo
 */
interface DialogData {
  modo: 'crear' | 'editar';
  escuela?: Escuela;
}

/**
 * Componente de diálogo para gestión de escuelas
 */
@Component({
  selector: 'app-escuela-dialog',
  templateUrl: './escuela-dialog.component.html',
  styleUrls: ['./escuela-dialog.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  standalone: true
})
export class EscuelaDialogComponent implements OnInit {
  // Formulario reactivo
  escuelaForm!: FormGroup;

  // Estado del componente
  isLoading = false;
  isSubmitting = false;

  // Datos del diálogo
  modo: 'crear' | 'editar';
  escuela?: Escuela;

  // Listas para selectores
  ciudades: any[] = [];
  provincias: any[] = [];

  /**
   * Constructor del componente
   */
  constructor(
    private formBuilder: FormBuilder,
    private adminService: AdminService,
    private dialogRef: MatDialogRef<EscuelaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private snackBar: MatSnackBar
  ) {
    this.modo = data.modo;
    this.escuela = data.escuela;
  }

  /**
   * Método que se ejecuta al inicializar el componente
   */
  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarDatosIniciales();
  }

  /**
   * Inicializa el formulario reactivo
   */
  inicializarFormulario(): void {
    this.escuelaForm = this.formBuilder.group({
      Nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      ID_Ciudad: ['', [Validators.required]]
    });

    // Si es modo editar, cargar datos existentes
    if (this.data.modo === 'editar' && this.data.escuela) {
      this.escuelaForm.patchValue({
        Nombre: this.data.escuela.Nombre,
        ID_Ciudad: this.data.escuela.ID_Ciudad
      });
    }
  }

  /**
   * Carga datos iniciales necesarios para el formulario
   */
  cargarDatosIniciales(): void {
    // Por ahora, cargamos datos de ejemplo
    // En una implementación real, estos vendrían del backend
    this.ciudades = [
      { ID: 505, Ciudad: 'Arroyito', ID_Provincia: 1 },
      { ID: 506, Ciudad: 'Córdoba', ID_Provincia: 1 },
      { ID: 507, Ciudad: 'Rosario', ID_Provincia: 2 }
    ];

    this.provincias = [
      { ID: 1, Provincia: 'Córdoba' },
      { ID: 2, Provincia: 'Santa Fe' },
      { ID: 3, Provincia: 'Buenos Aires' }
    ];
  }

  /**
   * Obtiene la provincia de una ciudad
   */
  obtenerProvinciaDeCiudad(idCiudad: number): string {
    const ciudad = this.ciudades.find(c => c.ID === idCiudad);
    if (ciudad) {
      const provincia = this.provincias.find(p => p.ID === ciudad.ID_Provincia);
      return provincia ? provincia.Provincia : '';
    }
    return '';
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.escuelaForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.isLoading = true;

      const formData = this.escuelaForm.value;

      if (this.modo === 'crear') {
        this.crearEscuela(formData);
      } else {
        this.actualizarEscuela(formData);
      }
    } else {
      this.marcarCamposComoTocados();
    }
  }

  /**
   * Crea una nueva escuela
   */
  crearEscuela(escuelaData: any): void {
    this.adminService.crearEscuela(escuelaData).subscribe({
      next: (escuelaCreada) => {
        console.log('🏫 Escuela creada:', escuelaCreada);
        this.mostrarNotificacion('Escuela creada exitosamente', 'success');
        this.dialogRef.close(escuelaCreada);
      },
      error: (error) => {
        console.error('❌ Error al crear escuela:', error);
        this.mostrarNotificacion('Error al crear la escuela', 'error');
        this.isSubmitting = false;
        this.isLoading = false;
      }
    });
  }

  /**
   * Actualiza una escuela existente
   */
  actualizarEscuela(escuelaData: any): void {
    if (!this.escuela) return;

    this.adminService.actualizarEscuela(this.escuela.ID, escuelaData).subscribe({
      next: (escuelaActualizada) => {
        console.log('🏫 Escuela actualizada:', escuelaActualizada);
        this.mostrarNotificacion('Escuela actualizada exitosamente', 'success');
        this.dialogRef.close(escuelaActualizada);
      },
      error: (error) => {
        console.error('❌ Error al actualizar escuela:', error);
        this.mostrarNotificacion('Error al actualizar la escuela', 'error');
        this.isSubmitting = false;
        this.isLoading = false;
      }
    });
  }

  /**
   * Marca todos los campos como tocados para mostrar errores
   */
  marcarCamposComoTocados(): void {
    Object.keys(this.escuelaForm.controls).forEach(key => {
      const control = this.escuelaForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Cierra el diálogo sin guardar
   */
  onCancel(): void {
    this.dialogRef.close();
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

  /**
   * Obtiene el texto del botón de envío
   */
  get submitButtonText(): string {
    return this.isSubmitting ? 'Guardando...' : (this.modo === 'crear' ? 'Crear Escuela' : 'Actualizar Escuela');
  }

  /**
   * Obtiene el título del diálogo
   */
  get dialogTitle(): string {
    return this.modo === 'crear' ? 'Nueva Escuela' : 'Editar Escuela';
  }

  /**
   * Verifica si un campo tiene error
   */
  hasError(fieldName: string): boolean {
    const field = this.escuelaForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtiene el mensaje de error para un campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.escuelaForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    
    if (field?.hasError('minlength')) {
      return `Mínimo ${field.errors?.['minlength'].requiredLength} caracteres`;
    }
    
    if (field?.hasError('maxlength')) {
      return `Máximo ${field.errors?.['maxlength'].requiredLength} caracteres`;
    }
    
    return '';
  }
} 