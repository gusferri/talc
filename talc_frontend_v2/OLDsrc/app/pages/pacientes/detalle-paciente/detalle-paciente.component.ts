import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PacienteService } from '../../../services/paciente.service';
import { UbicacionService } from '../../../services/ubicacion.service';
import { ObraSocialService } from '../../../services/obra-social.service';
import { EscuelaService } from '../../../services/escuela.service';
import { GeneroService } from '../../../services/genero.service';
import { forkJoin } from 'rxjs';

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
  pacienteForm: FormGroup;
  isLoading = true;
  isEditing = false;
  pacienteId: string | null = null;

  // Catálogos
  generos: any[] = [];
  provincias: any[] = [];
  ciudades: any[] = [];
  escuelas: any[] = [];
  obrasSociales: any[] = [];

  // Filtrados para autocompletes
  provinciasFiltradas: any[] = [];
  ciudadesFiltradas: any[] = [];
  escuelasFiltradas: any[] = [];
  obrasSocialesFiltradas: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private pacienteService: PacienteService,
    private ubicacionService: UbicacionService,
    private obraSocialService: ObraSocialService,
    private escuelaService: EscuelaService,
    private generoService: GeneroService
  ) {
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
      observaciones: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.pacienteId = this.route.snapshot.paramMap.get('id');
    if (this.pacienteId) {
      this.cargarCatalogosYDespuesPaciente(this.pacienteId);
    }
    this.setupFormListeners();
  }

  cargarCatalogosYDespuesPaciente(dni: string): void {
    this.isLoading = true;
    forkJoin({
      generos: this.generoService.obtenerGeneros(),
      provincias: this.ubicacionService.obtenerProvincias(),
      ciudades: this.ubicacionService.obtenerCiudades(),
      obrasSociales: this.obraSocialService.obtenerObrasSociales(),
      escuelas: this.escuelaService.obtenerEscuelas()
    }).subscribe({
      next: (catalogos) => {
        this.generos = catalogos.generos;
        this.provincias = catalogos.provincias;
        this.provinciasFiltradas = catalogos.provincias;
        this.ciudades = catalogos.ciudades;
        this.ciudadesFiltradas = catalogos.ciudades;
        this.obrasSociales = catalogos.obrasSociales;
        this.obrasSocialesFiltradas = catalogos.obrasSociales;
        this.escuelas = catalogos.escuelas;
        this.escuelasFiltradas = catalogos.escuelas;
        // Ahora sí cargar el paciente
        this.pacienteService.buscarPacientes(dni).subscribe({
          next: (pacientes) => {
            if (pacientes && pacientes.length > 0) {
              const paciente = pacientes[0];
              // Determinar provincia a partir de ciudad si es necesario
              let provinciaObj = this.provincias.find(p => p.ID === paciente.ID_Provincia) || '';
              let ciudadObj = this.ciudades.find(c => c.ID === paciente.ID_Ciudad) || '';
              if (ciudadObj && ciudadObj.ID_Provincia) {
                provinciaObj = this.provincias.find(p => p.ID === ciudadObj.ID_Provincia) || provinciaObj;
              }
              const escuelaObj = this.escuelas.find(e => e.ID === paciente.ID_Escuela) || '';
              const obraSocialObj = this.obrasSociales.find(o => o.ID === paciente.ID_ObraSocial) || '';
              const generoObj = this.generos.find(g => g.ID === paciente.ID_Genero) || '';
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
                observaciones: paciente.Observaciones
              };
              this.pacienteForm.patchValue(pacienteFormValue);
              // Forzar filtrado de ciudades para la provincia seleccionada
              if (provinciaObj) {
                this.filtrarCiudades(ciudadObj?.Ciudad || '');
              }
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error al cargar paciente:', error);
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

  setupFormListeners(): void {
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
    this.pacienteForm.get('estaEscolarizado')?.valueChanges.subscribe(value => {
      if (this.isEditing && value) {
        this.pacienteForm.get('escuela')?.enable();
      } else {
        this.pacienteForm.get('escuela')?.disable();
        this.pacienteForm.get('escuela')?.setValue('');
      }
    });
    this.pacienteForm.get('tieneObraSocial')?.valueChanges.subscribe(value => {
      if (this.isEditing && value) {
        this.pacienteForm.get('obraSocial')?.enable();
      } else {
        this.pacienteForm.get('obraSocial')?.disable();
        this.pacienteForm.get('obraSocial')?.setValue('');
      }
    });
  }

  // Métodos de filtrado para autocompletes (idénticos a nuevo-paciente)
  filtrarProvincias(value: string): void {
    if (!value) {
      this.provinciasFiltradas = this.provincias;
      return;
    }
    const filterValue = value.toLowerCase();
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
      next: (ciudades) => { this.ciudadesFiltradas = ciudades; },
      error: (error) => { console.error('Error al buscar ciudades:', error); this.ciudadesFiltradas = []; }
    });
  }
  filtrarEscuelas(value: string): void {
    const ciudad = this.pacienteForm.get('ciudad')?.value;
    if (!ciudad || !value) {
      this.escuelasFiltradas = [];
      return;
    }
    this.escuelaService.buscarEscuelasPorCiudad(ciudad.ID, value).subscribe({
      next: (escuelas) => { this.escuelasFiltradas = escuelas; },
      error: (error) => { console.error('Error al buscar escuelas:', error); this.escuelasFiltradas = []; }
    });
  }
  filtrarObrasSociales(value: string): void {
    if (!value) {
      this.obrasSocialesFiltradas = this.obrasSociales;
      return;
    }
    this.obraSocialService.buscarObrasSociales(value).subscribe({
      next: (os) => { this.obrasSocialesFiltradas = os; },
      error: (error) => { console.error('Error al buscar obras sociales:', error); this.obrasSocialesFiltradas = []; }
    });
  }

  habilitarEdicion(): void {
    this.isEditing = true;
    this.pacienteForm.enable();
  }

  cancelarEdicion(): void {
    this.isEditing = false;
    this.pacienteForm.disable();
  }

  guardarCambios(): void {
    if (this.pacienteForm.valid) {
      const formValue = this.pacienteForm.value;
      const pacienteActualizado = {
        dni: formValue.dni,
        apellido: formValue.apellido,
        nombre: formValue.nombre,
        fechaNacimiento: formValue.fechaNacimiento,
        idGenero: formValue.genero?.ID || null,
        idProvincia: formValue.provincia?.ID || null,
        idCiudad: formValue.ciudad?.ID || null,
        idEscuela: formValue.escuela?.ID || null,
        idObraSocial: formValue.obraSocial?.ID || null,
        telefono: formValue.telefono,
        email: formValue.email,
        observaciones: formValue.observaciones
      };

      this.pacienteService.actualizarPaciente(this.pacienteId!, pacienteActualizado).subscribe({
        next: (response) => {
          console.log('Paciente actualizado:', response);
          this.isEditing = false;
          this.pacienteForm.disable();
        },
        error: (error) => {
          console.error('Error al actualizar paciente:', error);
        }
      });
    }
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
} 