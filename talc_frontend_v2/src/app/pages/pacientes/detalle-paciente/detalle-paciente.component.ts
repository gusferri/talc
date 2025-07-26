/**
 * Componente para mostrar y editar los detalles de un paciente específico
 * 
 * Este componente permite visualizar toda la información de un paciente
 * y habilita la edición de sus datos mediante un formulario reactivo.
 * 
 * Funcionalidades principales:
 * - Carga y muestra datos completos del paciente
 * - Permite edición de información personal y médica
 * - Maneja catálogos dinámicos (géneros, ubicaciones, escuelas, obras sociales)
 * - Implementa autocompletado inteligente para ubicaciones
 * - Validación de formularios y manejo de estados
 */

// Importaciones de Angular Core
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

// Importaciones de Angular Forms
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Importaciones de Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Importaciones de servicios
import { PacienteService } from '../../../services/paciente.service';
import { UbicacionService } from '../../../services/ubicacion.service';
import { ObraSocialService } from '../../../services/obra-social.service';
import { EscuelaService } from '../../../services/escuela.service';
import { GeneroService } from '../../../services/genero.service';

// Importaciones de RxJS
import { forkJoin } from 'rxjs';

/**
 * Componente principal para gestión de detalles de paciente
 * Permite visualizar y editar toda la información de un paciente específico
 */
@Component({
  selector: 'app-detalle-paciente',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatSlideToggleModule
  ],
  templateUrl: './detalle-paciente.component.html',
  styleUrls: ['./detalle-paciente.component.scss']
})
export class DetallePacienteComponent implements OnInit {
  /** Formulario reactivo para manejar los datos del paciente */
  pacienteForm: FormGroup;
  
  /** Indica si se están cargando los datos iniciales */
  isLoading = true;
  
  /** Indica si el formulario está en modo edición */
  isEditing = false;
  
  /** ID del paciente obtenido de la URL */
  pacienteId: string | null = null;

  // Catálogos de datos para los campos del formulario
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
   * Inicializa el formulario reactivo con todos los campos necesarios
   */
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private pacienteService: PacienteService,
    private ubicacionService: UbicacionService,
    private obraSocialService: ObraSocialService,
    private escuelaService: EscuelaService,
    private generoService: GeneroService
  ) {
    // Inicialización del formulario reactivo con validaciones
    this.pacienteForm = this.fb.group({
      dni: [{ value: '', disabled: true }, [Validators.required]],
      apellido: [{ value: '', disabled: true }, [Validators.required]],
      nombre: [{ value: '', disabled: true }, [Validators.required]],
      fechaNacimiento: [{ value: '', disabled: true }, [Validators.required]],
      genero: [{ value: '', disabled: true }],
      provincia: [{ value: '', disabled: true }],
      ciudad: [{ value: '', disabled: true }],
      estaEscolarizado: [{ value: false, disabled: true }],
      escuela: [{ value: '', disabled: true }],
      tieneObraSocial: [{ value: false, disabled: true }],
      obraSocial: [{ value: '', disabled: true }],
      telefono: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      observaciones: [{ value: '', disabled: true }],
      activo: [{ value: true, disabled: true }]
    });
  }

  /**
   * Hook del ciclo de vida - se ejecuta al inicializar el componente
   * Obtiene el ID del paciente de la URL y carga los datos
   */
  ngOnInit(): void {
    // Obtener el ID del paciente de los parámetros de la URL
    this.pacienteId = this.route.snapshot.paramMap.get('id');
    if (this.pacienteId) {
      // Cargar catálogos y luego los datos del paciente
      this.cargarCatalogosYDespuesPaciente(this.pacienteId);
    }
    // Configurar listeners para cambios en el formulario
    this.setupFormListeners();
  }

  /**
   * Carga todos los catálogos necesarios y luego los datos del paciente
   * Utiliza forkJoin para cargar múltiples servicios en paralelo
   * 
   * @param dni - DNI del paciente a cargar
   */
  cargarCatalogosYDespuesPaciente(dni: string): void {
    this.isLoading = true;
    
    // Cargar todos los catálogos en paralelo usando forkJoin
    forkJoin({
      generos: this.generoService.buscarGeneros(),
      provincias: this.ubicacionService.obtenerProvincias(),
      ciudades: this.ubicacionService.obtenerCiudades(),
      obrasSociales: this.obraSocialService.obtenerObrasSociales(),
      escuelas: this.escuelaService.obtenerEscuelas()
    }).subscribe({
      next: (catalogos) => {
        // Asignar los catálogos cargados
        this.generos = catalogos.generos;
        this.provincias = catalogos.provincias;
        this.provinciasFiltradas = catalogos.provincias;
        this.ciudades = catalogos.ciudades;
        this.ciudadesFiltradas = catalogos.ciudades;
        this.obrasSociales = catalogos.obrasSociales;
        this.obrasSocialesFiltradas = catalogos.obrasSociales;
        this.escuelas = catalogos.escuelas;
        this.escuelasFiltradas = catalogos.escuelas;
        
        // Ahora cargar los datos del paciente
        this.pacienteService.obtenerPacientePorDni(dni).subscribe({
          next: (paciente) => {
            if (paciente) {
              // Buscar objetos relacionados en los catálogos
              let provinciaObj = this.provincias.find(p => p.ID === paciente.ID_Provincia) || '';
              let ciudadObj = this.ciudades.find(c => c.ID === paciente.ID_Ciudad) || '';
              
              // Si hay ciudad, determinar provincia a partir de ella
              if (ciudadObj && ciudadObj.ID_Provincia) {
                provinciaObj = this.provincias.find(p => p.ID === ciudadObj.ID_Provincia) || provinciaObj;
              }
              
              const escuelaObj = this.escuelas.find(e => e.ID === paciente.ID_Escuela) || '';
              const obraSocialObj = this.obrasSociales.find(o => o.ID === paciente.ID_ObraSocial) || '';
              const generoObj = this.generos.find(g => g.ID === paciente.ID_Genero) || '';
              
              // Preparar valores para el formulario
              const pacienteFormValue = {
                dni: paciente.DNI,
                apellido: paciente.Apellido,
                nombre: paciente.Nombre,
                fechaNacimiento: paciente.FechaNacimiento,
                genero: generoObj,
                provincia: provinciaObj,
                ciudad: ciudadObj,
                estaEscolarizado: !!paciente.ID_Escuela,
                escuela: escuelaObj,
                tieneObraSocial: !!paciente.ID_ObraSocial,
                obraSocial: obraSocialObj,
                telefono: paciente.Telefono,
                email: paciente.Email,
                observaciones: paciente.Observaciones,
                activo: paciente.Activo === 1
              };
              
              // Aplicar valores al formulario
              this.pacienteForm.patchValue(pacienteFormValue);
              
              // Filtrar ciudades para la provincia seleccionada
              if (provinciaObj) {
                this.filtrarCiudades(ciudadObj?.Ciudad || '');
              }
              
              console.log('✅ Paciente cargado exitosamente:', paciente.Nombre, paciente.Apellido, '(Activo:', paciente.Activo === 1 ? 'Sí' : 'No', ')');
            } else {
              console.error('❌ No se encontró el paciente con DNI:', dni);
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('❌ Error al cargar paciente:', error);
            if (error.status === 404) {
              console.error('❌ Paciente no encontrado con DNI:', dni);
            }
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar catálogos:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Configura los listeners para cambios en el formulario
   * Permite filtrado dinámico y habilitación/deshabilitación de campos
   */
  setupFormListeners(): void {
    // Listener para cambios en provincia
    this.pacienteForm.get('provincia')?.valueChanges.subscribe(value => {
      this.filtrarProvincias(value);
    });
    
    // Listener para cambios en ciudad
    this.pacienteForm.get('ciudad')?.valueChanges.subscribe(value => {
      this.filtrarCiudades(value);
    });
    
    // Listener para cambios en escuela
    this.pacienteForm.get('escuela')?.valueChanges.subscribe(value => {
      this.filtrarEscuelas(value);
    });
    
    // Listener para cambios en obra social
    this.pacienteForm.get('obraSocial')?.valueChanges.subscribe(value => {
      this.filtrarObrasSociales(value);
    });
    
    // Listener para escolarización
    this.pacienteForm.get('estaEscolarizado')?.valueChanges.subscribe(value => {
      if (this.isEditing && value) {
        this.pacienteForm.get('escuela')?.enable();
      } else {
        this.pacienteForm.get('escuela')?.disable();
        this.pacienteForm.get('escuela')?.setValue('');
      }
    });
    
    // Listener para obra social
    this.pacienteForm.get('tieneObraSocial')?.valueChanges.subscribe(value => {
      if (this.isEditing && value) {
        this.pacienteForm.get('obraSocial')?.enable();
      } else {
        this.pacienteForm.get('obraSocial')?.disable();
        this.pacienteForm.get('obraSocial')?.setValue('');
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
      next: (ciudades) => { this.ciudadesFiltradas = ciudades; },
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
      next: (escuelas) => { this.escuelasFiltradas = escuelas; },
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
      next: (os) => { this.obrasSocialesFiltradas = os; },
      error: (error) => { 
        console.error('Error al buscar obras sociales:', error); 
        this.obrasSocialesFiltradas = []; 
      }
    });
  }

  /**
   * Habilita el modo de edición del formulario
   * Permite al usuario modificar los datos del paciente
   */
  habilitarEdicion(): void {
    this.isEditing = true;
    this.pacienteForm.enable();
  }

  /**
   * Cancela la edición y vuelve al modo de solo lectura
   * Deshabilita todos los campos del formulario
   */
  cancelarEdicion(): void {
    this.isEditing = false;
    this.pacienteForm.disable();
  }

  /**
   * Guarda los cambios realizados en el formulario
   * Valida el formulario y envía los datos actualizados al servidor
   */
  guardarCambios(): void {
    if (this.pacienteForm.valid) {
      const formValue = this.pacienteForm.value;
      
      // Debug: Log del valor del campo activo
      console.log('🔍 Valor del campo activo en el formulario:', formValue.activo);
      console.log('🔍 Tipo de dato del campo activo:', typeof formValue.activo);
      
      // Formatear la fecha de nacimiento para MySQL (YYYY-MM-DD)
      let fechaNacimiento = formValue.fechaNacimiento;
      if (fechaNacimiento) {
        const fecha = new Date(fechaNacimiento);
        fechaNacimiento = fecha.toISOString().split('T')[0];
      }
      
      // Preparar objeto con los datos actualizados
      const pacienteActualizado = {
        dni: formValue.dni,
        apellido: formValue.apellido,
        nombre: formValue.nombre,
        fechaNacimiento: fechaNacimiento,
        idGenero: formValue.genero?.ID || null,
        idProvincia: formValue.provincia?.ID || null,
        idCiudad: formValue.ciudad?.ID || null,
        idEscuela: formValue.escuela?.ID || null,
        idObraSocial: formValue.obraSocial?.ID || null,
        telefono: formValue.telefono,
        email: formValue.email,
        observaciones: formValue.observaciones,
        activo: formValue.activo ? 1 : 0
      };

      // Debug: Log del objeto que se va a enviar
      console.log('🔍 Objeto paciente a enviar:', pacienteActualizado);
      console.log('🔍 Valor final del campo activo:', pacienteActualizado.activo);

      // Enviar actualización al servidor
      this.pacienteService.actualizarPaciente(this.pacienteId!, pacienteActualizado).subscribe({
        next: (response) => {
          console.log('✅ Paciente actualizado exitosamente:', response);
          this.isEditing = false;
          this.pacienteForm.disable();
        },
        error: (error) => {
          console.error('❌ Error al actualizar paciente:', error);
          console.error('❌ Detalles del error:', error.error);
        }
      });
    }
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
} 