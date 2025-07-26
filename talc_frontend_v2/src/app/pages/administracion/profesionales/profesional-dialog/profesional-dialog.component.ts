/**
 * Componente ProfesionalDialog - Diálogo para crear/editar profesionales
 * 
 * Este componente proporciona un formulario modal para crear nuevos profesionales
 * o editar profesionales existentes en el sistema TALC.
 * 
 * Funcionalidades principales:
 * - Formulario reactivo para datos de profesionales
 * - Validación de campos requeridos
 * - Integración con servicios de backend
 * - Manejo de errores y notificaciones
 * 
 * Responsabilidades:
 * - Gestionar el estado del formulario
 * - Validar datos antes de enviar
 * - Comunicar resultados al componente padre
 * - Proporcionar interfaz de usuario intuitiva
 */

import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// Importaciones de Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';

// Importaciones de servicios
import { AdminService, Profesional, Especialidad } from '../../../../services/admin.service';
import { UbicacionService } from '../../../../services/ubicacion.service';

/**
 * Interfaz para los datos del diálogo
 */
interface DialogData {
  modo: 'crear' | 'editar';
  profesional?: Profesional;
}

/**
 * Componente de diálogo para profesionales
 */
@Component({
  selector: 'app-profesional-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatCardModule
  ],
  templateUrl: './profesional-dialog.component.html',
  styleUrls: ['./profesional-dialog.component.scss']
})
export class ProfesionalDialogComponent implements OnInit {
  // Formulario reactivo
  profesionalForm!: FormGroup;
  
  // Estado del componente
  isLoading = false;
  isEditMode = false;
  
  // Datos del profesional (para modo edición)
  profesionalOriginal?: Profesional;
  
  // Opciones para selectores
  generos = [
    { value: 'Femenino', label: 'Femenino' },
    { value: 'Masculino', label: 'Masculino' },
    { value: 'No declarado', label: 'No declarado' }
  ];

  // Especialidades disponibles
  especialidades: Especialidad[] = [];
  
  // Arrays para ubicación
  provincias: any[] = [];
  ciudades: any[] = [];
  provinciasFiltradas: any[] = [];
  ciudadesFiltradas: any[] = [];

  /**
   * Constructor del componente
   */
  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<ProfesionalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private adminService: AdminService,
    private ubicacionService: UbicacionService,
    private snackBar: MatSnackBar
  ) {
    this.isEditMode = data.modo === 'editar';
    this.profesionalOriginal = data.profesional;
  }

  /**
   * Método que se ejecuta al inicializar el componente
   */
  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarEspecialidades();
    this.cargarDatosUbicacion();
    this.setupFormListeners();
    
    if (this.isEditMode && this.profesionalOriginal) {
      this.cargarDatosProfesional();
    }
  }

  /**
   * Carga las especialidades disponibles
   */
  cargarEspecialidades(): void {
    this.adminService.obtenerEspecialidades().subscribe({
      next: (especialidades) => {
        this.especialidades = especialidades;
      },
      error: (error) => {
        console.error('❌ Error al cargar especialidades:', error);
        this.mostrarNotificacion('Error al cargar especialidades', 'error');
      }
    });
  }

  /**
   * Inicializa el formulario reactivo
   */
  inicializarFormulario(): void {
    this.profesionalForm = this.formBuilder.group({
      Nombre: ['', [Validators.required, Validators.minLength(2)]],
      Apellido: ['', [Validators.required, Validators.minLength(2)]],
      Email: ['', [Validators.required, Validators.email]],
      Telefono: ['', [Validators.required, Validators.minLength(8)]],
      DNI: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(8)]],
      Matricula: ['', [Validators.required]],
      FechaNacimiento: [null],
      Genero: [null],
      Domicilio: [null],
      ID_Provincia: [null],
      ID_Ciudad: [null],
      Observaciones: [null],
      UsaIntegracionCalendar: [false],
      Activo: [true], // Por defecto activo
      Especialidades: [[]] // Lista de IDs de especialidades
    });
  }

  /**
   * Carga los datos del profesional en el formulario (modo edición)
   */
  cargarDatosProfesional(): void {
    if (this.profesionalOriginal) {
      // Crear objetos para provincia y ciudad
      const provinciaObj = this.profesionalOriginal.ID_Provincia ? {
        ID: this.profesionalOriginal.ID_Provincia,
        Provincia: this.profesionalOriginal.NombreProvincia
      } : null;
      
      const ciudadObj = this.profesionalOriginal.ID_Ciudad ? {
        ID: this.profesionalOriginal.ID_Ciudad,
        Ciudad: this.profesionalOriginal.NombreCiudad,
        ID_Provincia: this.profesionalOriginal.ID_Provincia
      } : null;
      
      this.profesionalForm.patchValue({
        Nombre: this.profesionalOriginal.Nombre,
        Apellido: this.profesionalOriginal.Apellido,
        Email: this.profesionalOriginal.Email,
        Telefono: this.profesionalOriginal.Telefono,
        DNI: this.profesionalOriginal.DNI || '',
        Matricula: this.profesionalOriginal.Matricula || '',
        FechaNacimiento: this.profesionalOriginal.FechaNacimiento || null,
        Genero: this.profesionalOriginal.NombreGenero || null,
        Domicilio: this.profesionalOriginal.Domicilio || null,
        ID_Provincia: provinciaObj,
        ID_Ciudad: ciudadObj,
        Observaciones: this.profesionalOriginal.Observaciones || null,
        UsaIntegracionCalendar: this.profesionalOriginal.UsaIntegracionCalendar || false,
        Activo: this.profesionalOriginal.Activo !== undefined ? this.profesionalOriginal.Activo : true,
        Especialidades: this.profesionalOriginal.Especialidades || []
      });
      
      // Si hay ciudad, cargar las ciudades de esa provincia
      if (ciudadObj && provinciaObj) {
        this.filtrarCiudades(ciudadObj.Ciudad || '');
      }
    }
  }

  /**
   * Carga los datos de ubicación (provincias)
   */
  cargarDatosUbicacion(): void {
    this.ubicacionService.obtenerProvincias().subscribe({
      next: (provincias) => {
        this.provincias = provincias;
        this.provinciasFiltradas = provincias;
      },
      error: (error) => {
        console.error('Error al cargar provincias:', error);
      }
    });
  }

  /**
   * Configura los listeners del formulario para selección dependiente
   */
  setupFormListeners(): void {
    // Provincia: Filtrar provincias según entrada del usuario
    this.profesionalForm.get('ID_Provincia')?.valueChanges.subscribe(value => {
      this.filtrarProvincias(value);
    });

    // Ciudad: Filtrar ciudades según provincia seleccionada
    this.profesionalForm.get('ID_Ciudad')?.valueChanges.subscribe(value => {
      this.filtrarCiudades(value);
    });
  }

  /**
   * Filtra las provincias para el autocompletado
   */
  filtrarProvincias(value: any): void {
    if (!value) {
      this.provinciasFiltradas = this.provincias;
      return;
    }
    // Manejar tanto strings como objetos
    const filterValue = typeof value === 'string' ? value.toLowerCase() : (value.Provincia || '').toLowerCase();
    this.provinciasFiltradas = this.provincias.filter(provincia =>
      provincia.Provincia.toLowerCase().includes(filterValue)
    );
  }

  /**
   * Filtra las ciudades basándose en la provincia seleccionada
   */
  filtrarCiudades(value: string): void {
    const provincia = this.profesionalForm.get('ID_Provincia')?.value;
    if (!provincia || !value) {
      this.ciudadesFiltradas = [];
      return;
    }

    this.ubicacionService.buscarCiudadesPorProvincia(provincia.ID, value).subscribe({
      next: (ciudades) => {
        this.ciudadesFiltradas = ciudades;
      },
      error: (error) => {
        console.error('Error al buscar ciudades:', error);
        this.ciudadesFiltradas = [];
      }
    });
  }

  /**
   * Función helper para mostrar el nombre de la provincia en el autocompletado
   */
  mostrarNombreProvincia(provincia: any): string {
    return provincia?.Provincia || '';
  }

  /**
   * Función helper para mostrar el nombre de la ciudad en el autocompletado
   */
  mostrarNombreCiudad(ciudad: any): string {
    return ciudad?.Ciudad || '';
  }

  /**
   * Obtiene la provincia correspondiente a una ciudad
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
   * Limpia los datos del formulario eliminando campos vacíos
   */
  limpiarDatos(datos: any): any {
    const datosLimpios: any = {};
    
    // Campos que deben ser null si están vacíos (campos opcionales)
    const camposOpcionales = ['FechaNacimiento', 'Genero', 'Domicilio', 'ID_Ciudad', 'Observaciones'];
    
    Object.keys(datos).forEach(key => {
      const valor = datos[key];
      
      // Excluir ID_Provincia ya que no se guarda en la tabla Profesional
      if (key === 'ID_Provincia') {
        return;
      }
      
      if (valor !== null && valor !== undefined && valor !== '') {
        if (Array.isArray(valor) && valor.length === 0) {
          // No incluir arrays vacíos
          return;
        }
        
        // Manejo especial para fecha de nacimiento
        if (key === 'FechaNacimiento' && valor instanceof Date) {
          datosLimpios[key] = valor.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        } else if (key === 'ID_Ciudad' && typeof valor === 'object' && valor.ID) {
          // Extraer solo el ID de la ciudad si se envía un objeto completo
          datosLimpios[key] = valor.ID;
        } else {
          datosLimpios[key] = valor;
        }
      } else if (camposOpcionales.includes(key)) {
        // Para campos opcionales, enviar null en lugar de string vacío
        datosLimpios[key] = null;
      }
    });
    
    return datosLimpios;
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.profesionalForm.valid) {
      this.isLoading = true;
      
      const datosProfesional = this.profesionalForm.value;
      const datosLimpios = this.limpiarDatos(datosProfesional);
      
      if (this.isEditMode && this.profesionalOriginal) {
        // Modo edición
        this.adminService.actualizarProfesional(this.profesionalOriginal.ID, datosLimpios).subscribe({
          next: (profesionalActualizado) => {
            this.dialogRef.close(profesionalActualizado);
            this.mostrarNotificacion('Profesional actualizado exitosamente', 'success');
          },
          error: (error) => {
            console.error('❌ Error al actualizar profesional:', error);
            this.mostrarNotificacion('Error al actualizar el profesional', 'error');
            this.isLoading = false;
          }
        });
      } else {
        // Modo creación
        this.adminService.crearProfesional(datosLimpios).subscribe({
          next: (nuevoProfesional) => {
            this.dialogRef.close(nuevoProfesional);
            this.mostrarNotificacion('Profesional creado exitosamente', 'success');
          },
          error: (error) => {
            console.error('❌ Error al crear profesional:', error);
            this.mostrarNotificacion('Error al crear el profesional', 'error');
            this.isLoading = false;
          }
        });
      }
    } else {
      this.marcarCamposInvalidos();
    }
  }

  /**
   * Marca los campos inválidos como touched para mostrar errores
   */
  marcarCamposInvalidos(): void {
    Object.keys(this.profesionalForm.controls).forEach(key => {
      const control = this.profesionalForm.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }

  /**
   * Cierra el diálogo sin guardar cambios
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
   * Obtiene el mensaje de error para un campo específico
   */
  getErrorMessage(campo: string): string {
    const control = this.profesionalForm.get(campo);
    
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    
    if (control?.hasError('email')) {
      return 'Ingrese un email válido';
    }
    
    if (control?.hasError('minlength')) {
      const requiredLength = control.getError('minlength').requiredLength;
      if (campo === 'DNI') {
        return `El DNI debe tener al menos ${requiredLength} dígitos`;
      }
      return `Debe tener al menos ${requiredLength} caracteres`;
    }
    
    if (control?.hasError('maxlength')) {
      const requiredLength = control.getError('maxlength').requiredLength;
      if (campo === 'DNI') {
        return `El DNI debe tener máximo ${requiredLength} dígitos`;
      }
      return `Debe tener máximo ${requiredLength} caracteres`;
    }
    
    return 'Campo inválido';
  }

  /**
   * Verifica si un campo es inválido y ha sido tocado
   */
  isFieldInvalid(campo: string): boolean {
    const control = this.profesionalForm.get(campo);
    return !!(control?.invalid && control?.touched);
  }
} 