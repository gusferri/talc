/**
 * Componente para crear nuevos pacientes en el sistema TALC
 * 
 * Este componente proporciona un formulario completo y validado para
 * registrar nuevos pacientes con toda su información personal, de contacto,
 * ubicación y datos adicionales.
 * 
 * Funcionalidades principales:
 * - Formulario reactivo con validaciones avanzadas
 * - Habilitación progresiva de campos
 * - Autocompletado inteligente para ubicaciones
 * - Carga de catálogos dinámicos
 * - Validación de datos en tiempo real
 * - Capitalización automática de nombres
 * - Gestión de estados de carga y envío
 */

// Importaciones de Angular Core
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Importaciones de Angular Forms
import { ReactiveFormsModule, FormBuilder, Validators, FormControl, FormGroup } from '@angular/forms';

// Importaciones de Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

// Importaciones de servicios
import { PacienteService } from '../../../services/paciente.service';
import { UbicacionService } from '../../../services/ubicacion.service';
import { ObraSocialService } from '../../../services/obra-social.service';
import { EscuelaService } from '../../../services/escuela.service';
import { GeneroService } from '../../../services/genero.service';

/**
 * Componente principal para creación de nuevos pacientes
 * Maneja todo el proceso de registro con validaciones y UX optimizada
 */
@Component({
  selector: 'app-nuevo-paciente',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './nuevo-paciente.component.html',
  styleUrls: ['./nuevo-paciente.component.scss']
})
export class NuevoPacienteComponent implements OnInit {
  /** Formulario reactivo para los datos del paciente */
  pacienteForm: FormGroup;
  
  /** Estado de carga de datos iniciales */
  isLoading = false;
  
  /** Estado de envío del formulario */
  isSubmitting = false;

  // Arrays de datos para los catálogos
  /** Lista de géneros disponibles */
  generos: any[] = [];
  /** Lista de provincias disponibles */
  provincias: any[] = [];
  /** Lista de ciudades disponibles */
  ciudades: any[] = [];
  /** Lista de escuelas disponibles */
  escuelas: any[] = [];
  /** Lista de obras sociales disponibles */
  obrasSociales: any[] = [];

  // Arrays filtrados para autocompletado
  /** Provincias filtradas para el autocompletado */
  provinciasFiltradas: any[] = [];
  /** Ciudades filtradas para el autocompletado */
  ciudadesFiltradas: any[] = [];
  /** Escuelas filtradas para el autocompletado */
  escuelasFiltradas: any[] = [];
  /** Obras sociales filtradas para el autocompletado */
  obrasSocialesFiltradas: any[] = [];

  /**
   * Constructor del componente
   * Inicializa el formulario reactivo con todas las validaciones necesarias
   */
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private pacienteService: PacienteService,
    private ubicacionService: UbicacionService,
    private obraSocialService: ObraSocialService,
    private escuelaService: EscuelaService,
    private generoService: GeneroService,
    private snackBar: MatSnackBar
  ) {
    // Inicialización del formulario reactivo con validaciones
    this.pacienteForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      apellido: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      genero: ['', [Validators.required]],
      provincia: [''],
      ciudad: [''],
      escuela: [''],
      tieneObraSocial: [false],
      obraSocial: [''],
      estaEscolarizado: [false],
      telefono: ['', [Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.email]],
      observaciones: ['']
    });

    // Configurar listeners para cambios en el formulario
    this.setupFormListeners();
  }

  /**
   * Hook del ciclo de vida - se ejecuta al inicializar el componente
   * Carga los datos iniciales necesarios para el formulario
   */
  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  /**
   * Configura los listeners para cambios en el formulario
   * Implementa habilitación progresiva de campos y filtrado dinámico
   */
  setupFormListeners(): void {
    // Habilitación progresiva de campos basada en validaciones previas
    
    // DNI: Habilitar apellido solo si DNI tiene 8 dígitos
    this.pacienteForm.get('dni')?.valueChanges.subscribe(value => {
      if (value && value.toString().length === 8) {
        this.pacienteForm.get('apellido')?.enable();
      } else {
        this.pacienteForm.get('apellido')?.disable();
      }
    });

    // Apellido: Habilitar nombre solo si apellido no está vacío
    this.pacienteForm.get('apellido')?.valueChanges.subscribe(value => {
      if (value && value.trim().length > 0) {
        this.pacienteForm.get('nombre')?.enable();
      } else {
        this.pacienteForm.get('nombre')?.disable();
      }
    });

    // Nombre: Habilitar fecha de nacimiento solo si nombre no está vacío
    this.pacienteForm.get('nombre')?.valueChanges.subscribe(value => {
      if (value && value.trim().length > 0) {
        this.pacienteForm.get('fechaNacimiento')?.enable();
      } else {
        this.pacienteForm.get('fechaNacimiento')?.disable();
      }
    });

    // Fecha de nacimiento: Habilitar género solo si fecha está seleccionada
    this.pacienteForm.get('fechaNacimiento')?.valueChanges.subscribe(value => {
      if (value) {
        this.pacienteForm.get('genero')?.enable();
      } else {
        this.pacienteForm.get('genero')?.disable();
      }
    });

    // Género: Habilitar provincia solo si género está seleccionado
    this.pacienteForm.get('genero')?.valueChanges.subscribe(value => {
      if (value) {
        this.pacienteForm.get('provincia')?.enable();
      } else {
        this.pacienteForm.get('provincia')?.disable();
      }
    });

    // Listeners para autocompletado
    // Provincia: Filtrar provincias según entrada del usuario
    this.pacienteForm.get('provincia')?.valueChanges.subscribe(value => {
      this.filtrarProvincias(value);
    });

    // Ciudad: Filtrar ciudades según provincia seleccionada
    this.pacienteForm.get('ciudad')?.valueChanges.subscribe(value => {
      this.filtrarCiudades(value);
    });

    // Escuela: Filtrar escuelas según ciudad seleccionada
    this.pacienteForm.get('escuela')?.valueChanges.subscribe(value => {
      this.filtrarEscuelas(value);
    });

    // Obra social: Filtrar obras sociales según entrada del usuario
    this.pacienteForm.get('obraSocial')?.valueChanges.subscribe(value => {
      this.filtrarObrasSociales(value);
    });
  }

  /**
   * Carga los datos iniciales necesarios para el formulario
   * Obtiene catálogos de géneros, provincias, obras sociales y escuelas
   */
  cargarDatosIniciales(): void {
    this.isLoading = true;
    
    // Cargar géneros
    this.generoService.buscarGeneros().subscribe({
      next: (generos) => {
        this.generos = generos;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar géneros:', error);
        this.isLoading = false;
      }
    });

    // Cargar provincias
    this.ubicacionService.obtenerProvincias().subscribe({
      next: (provincias) => {
        this.provincias = provincias;
      },
      error: (error) => {
        console.error('Error al cargar provincias:', error);
      }
    });

    // Cargar obras sociales
    this.obraSocialService.obtenerObrasSociales().subscribe({
      next: (obrasSociales) => {
        this.obrasSociales = obrasSociales;
      },
      error: (error) => {
        console.error('Error al cargar obras sociales:', error);
      }
    });

    // Cargar escuelas
    this.escuelaService.obtenerEscuelas().subscribe({
      next: (escuelas) => {
        this.escuelas = escuelas;
      },
      error: (error) => {
        console.error('Error al cargar escuelas:', error);
      }
    });
  }

  /**
   * Filtra las provincias para el autocompletado
   * 
   * @param value - Valor de entrada para filtrar
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
   * 
   * @param value - Valor de entrada para filtrar
   */
  filtrarCiudades(value: string): void {
    const provincia = this.pacienteForm.get('provincia')?.value;
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
   * Filtra las escuelas basándose en la ciudad seleccionada
   * 
   * @param value - Valor de entrada para filtrar
   */
  filtrarEscuelas(value: string): void {
    const ciudad = this.pacienteForm.get('ciudad')?.value;
    if (!ciudad || !value) {
      this.escuelasFiltradas = [];
      return;
    }

    // Verificar que ciudad tenga el ID necesario
    if (!ciudad.ID) {
      console.error('La ciudad seleccionada no tiene ID válido');
      this.escuelasFiltradas = [];
      return;
    }

    this.escuelaService.buscarEscuelasPorCiudad(value, ciudad.ID).subscribe({
      next: (escuelas) => {
        this.escuelasFiltradas = escuelas;
      },
      error: (error) => {
        console.error('Error al buscar escuelas:', error);
        this.escuelasFiltradas = [];
      }
    });
  }

  /**
   * Filtra las obras sociales para el autocompletado
   * 
   * @param value - Valor de entrada para filtrar
   */
  filtrarObrasSociales(value: string): void {
    if (!value) {
      this.obrasSocialesFiltradas = this.obrasSociales;
      return;
    }

    this.obraSocialService.buscarObrasSociales(value).subscribe({
      next: (obrasSociales) => {
        this.obrasSocialesFiltradas = obrasSociales;
      },
      error: (error) => {
        console.error('Error al buscar obras sociales:', error);
        this.obrasSocialesFiltradas = [];
      }
    });
  }

  /**
   * Función helper para mostrar el nombre de la provincia en el autocompletado
   * 
   * @param provincia - Objeto provincia
   * @returns Nombre de la provincia o string vacío
   */
  mostrarNombreProvincia(provincia: any): string {
    return provincia?.Provincia || '';
  }

  /**
   * Función helper para mostrar el nombre de la ciudad en el autocompletado
   * 
   * @param ciudad - Objeto ciudad
   * @returns Nombre de la ciudad o string vacío
   */
  mostrarNombreCiudad(ciudad: any): string {
    return ciudad?.Ciudad || '';
  }

  /**
   * Función helper para mostrar el nombre de la escuela en el autocompletado
   * 
   * @param escuela - Objeto escuela
   * @returns Nombre de la escuela o string vacío
   */
  mostrarNombreEscuela(escuela: any): string {
    return escuela?.Nombre || '';
  }

  /**
   * Función helper para mostrar el nombre de la obra social en el autocompletado
   * 
   * @param obra - Objeto obra social
   * @returns Nombre de la obra social o string vacío
   */
  mostrarNombreObraSocial(obra: any): string {
    return obra?.Nombre || '';
  }

  /**
   * Capitaliza automáticamente el texto de un campo específico
   * Se ejecuta al perder el foco (evento blur)
   * 
   * @param controlName - Nombre del control a capitalizar
   */
  capitalizarTexto(controlName: string): void {
    const control = this.pacienteForm.get(controlName);
    if (control) {
      const valor = control.value || '';
      const capitalizado = valor
        .toLowerCase()
        .replace(/\b\w/g, (letra: string) => letra.toUpperCase());
      control.setValue(capitalizado, { emitEvent: false });
    }
  }

  /**
   * Valida que la fecha de nacimiento sea anterior a la fecha actual
   * 
   * @param fecha - Fecha a validar
   * @returns true si la fecha es válida (pasada), false en caso contrario
   */
  validarFechaNacimiento(fecha: Date): boolean {
    if (!fecha) return false;
    const hoy = new Date();
    return fecha < hoy;
  }

  /**
   * Guarda el nuevo paciente en el sistema
   * Valida el formulario y envía los datos al servidor
   */
  guardarPaciente(): void {
    if (this.pacienteForm.valid) {
      this.isSubmitting = true;
      
      const pacienteData = this.pacienteForm.value;
      
      // Formatear la fecha de nacimiento para MySQL (YYYY-MM-DD)
      if (pacienteData.fechaNacimiento) {
        const fecha = new Date(pacienteData.fechaNacimiento);
        pacienteData.fechaNacimiento = fecha.toISOString().split('T')[0];
      }
      
      this.pacienteService.insertarPaciente(pacienteData).subscribe({
        next: (response) => {
          // Éxito: mostrar mensaje y navegar a la lista de pacientes
          this.snackBar.open('Paciente guardado exitosamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
          this.router.navigate(['/pacientes']);
        },
        error: (error) => {
          // Error: mostrar mensaje de error y permitir reintentar
          console.error('Error al guardar paciente:', error);
          this.snackBar.open('Error al guardar el paciente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
          this.isSubmitting = false;
        }
      });
    } else {
      // Formulario inválido: marcar campos con errores
      this.marcarCamposInvalidos();
    }
  }

  /**
   * Marca todos los campos inválidos como "touched"
   * Esto activa la visualización de errores en el formulario
   */
  marcarCamposInvalidos(): void {
    Object.keys(this.pacienteForm.controls).forEach(key => {
      const control = this.pacienteForm.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }

  /**
   * Cancela la creación del paciente y regresa a la lista
   */
  cancelar(): void {
    this.router.navigate(['/pacientes']);
  }

  /**
   * Limpia todos los campos del formulario
   * Restablece los valores por defecto de los toggles
   */
  limpiarFormulario(): void {
    this.pacienteForm.reset();
    this.pacienteForm.patchValue({
      tieneObraSocial: false,
      estaEscolarizado: false
    });
  }
} 