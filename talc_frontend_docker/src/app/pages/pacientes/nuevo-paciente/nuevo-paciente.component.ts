import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
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

// Services
import { PacienteService } from '../../../services/paciente.service';
import { UbicacionService } from '../../../services/ubicacion.service';
import { ObraSocialService } from '../../../services/obra-social.service';
import { EscuelaService } from '../../../services/escuela.service';
import { GeneroService } from '../../../services/genero.service';

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
  pacienteForm: FormGroup;
  isLoading = false;
  isSubmitting = false;

  // Data arrays
  generos: any[] = [];
  provincias: any[] = [];
  ciudades: any[] = [];
  escuelas: any[] = [];
  obrasSociales: any[] = [];

  // Filtered arrays for autocomplete
  provinciasFiltradas: any[] = [];
  ciudadesFiltradas: any[] = [];
  escuelasFiltradas: any[] = [];
  obrasSocialesFiltradas: any[] = [];

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

    this.setupFormListeners();
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  setupFormListeners(): void {
    // Habilitar campos progresivamente
    this.pacienteForm.get('dni')?.valueChanges.subscribe(value => {
      if (value && value.toString().length === 8) {
        this.pacienteForm.get('apellido')?.enable();
      } else {
        this.pacienteForm.get('apellido')?.disable();
      }
    });

    this.pacienteForm.get('apellido')?.valueChanges.subscribe(value => {
      if (value && value.trim().length > 0) {
        this.pacienteForm.get('nombre')?.enable();
      } else {
        this.pacienteForm.get('nombre')?.disable();
      }
    });

    this.pacienteForm.get('nombre')?.valueChanges.subscribe(value => {
      if (value && value.trim().length > 0) {
        this.pacienteForm.get('fechaNacimiento')?.enable();
      } else {
        this.pacienteForm.get('fechaNacimiento')?.disable();
      }
    });

    this.pacienteForm.get('fechaNacimiento')?.valueChanges.subscribe(value => {
      if (value) {
        this.pacienteForm.get('genero')?.enable();
      } else {
        this.pacienteForm.get('genero')?.disable();
      }
    });

    this.pacienteForm.get('genero')?.valueChanges.subscribe(value => {
      if (value) {
        this.pacienteForm.get('provincia')?.enable();
      } else {
        this.pacienteForm.get('provincia')?.disable();
      }
    });

    // Autocomplete listeners
    this.pacienteForm.get('provincia')?.valueChanges.subscribe(value => {
      this.filtrarProvincias(value);
    });

    this.pacienteForm.get('ciudad')?.valueChanges.subscribe(value => {
      this.filtrarCiudades(value);
    });

    this.pacienteForm.get('escuela')?.valueChanges.subscribe(value => {
      this.filtrarEscuelas(value);
    });

    this.pacienteForm.get('obraSocial')?.valueChanges.subscribe(value => {
      this.filtrarObrasSociales(value);
    });
  }

  cargarDatosIniciales(): void {
    this.isLoading = true;
    
    // Cargar géneros
    this.generoService.obtenerGeneros().subscribe({
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

  filtrarProvincias(value: any): void {
    if (!value) {
      this.provinciasFiltradas = this.provincias;
      return;
    }
    // Si value es string, usarlo; si es objeto, usar value.Provincia
    const filterValue = typeof value === 'string' ? value.toLowerCase() : (value.Provincia || '').toLowerCase();
    this.provinciasFiltradas = this.provincias.filter(provincia =>
      provincia.Provincia.toLowerCase().includes(filterValue)
    );
  }

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

  filtrarEscuelas(value: string): void {
    const ciudad = this.pacienteForm.get('ciudad')?.value;
    if (!ciudad || !value) {
      this.escuelasFiltradas = [];
      return;
    }

    this.escuelaService.buscarEscuelasPorCiudad(ciudad.ID, value).subscribe({
      next: (escuelas) => {
        this.escuelasFiltradas = escuelas;
      },
      error: (error) => {
        console.error('Error al buscar escuelas:', error);
        this.escuelasFiltradas = [];
      }
    });
  }

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

  mostrarNombreProvincia(provincia: any): string {
    return provincia?.Provincia || '';
  }

  mostrarNombreCiudad(ciudad: any): string {
    return ciudad?.Ciudad || '';
  }

  mostrarNombreEscuela(escuela: any): string {
    return escuela?.Nombre || '';
  }

  mostrarNombreObraSocial(obra: any): string {
    return obra?.Nombre || '';
  }

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

  validarFechaNacimiento(fecha: Date): boolean {
    if (!fecha) return false;
    const hoy = new Date();
    return fecha < hoy;
  }

  guardarPaciente(): void {
    if (this.pacienteForm.valid) {
      this.isSubmitting = true;
      
      const pacienteData = this.pacienteForm.value;
      
      this.pacienteService.insertarPaciente(pacienteData).subscribe({
        next: (response) => {
          this.snackBar.open('Paciente guardado exitosamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
          this.router.navigate(['/pacientes']);
        },
        error: (error) => {
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
      this.marcarCamposInvalidos();
    }
  }

  marcarCamposInvalidos(): void {
    Object.keys(this.pacienteForm.controls).forEach(key => {
      const control = this.pacienteForm.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/pacientes']);
  }

  limpiarFormulario(): void {
    this.pacienteForm.reset();
    this.pacienteForm.patchValue({
      tieneObraSocial: false,
      estaEscolarizado: false
    });
  }
} 