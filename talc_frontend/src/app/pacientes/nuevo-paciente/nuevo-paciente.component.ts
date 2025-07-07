import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { HttpClientModule } from '@angular/common/http';
import { PacienteService } from '../paciente.service';
import { UbicacionService } from '../ubicacion.service';
import { ObraSocialService } from '../obra-social.service';
import { EscuelaService } from '../escuela.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import { GeneroService } from '../genero.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    HttpClientModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatSlideToggleModule // Importar el módulo aquí
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE]
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'DD/MM/YYYY',
        },
        display: {
          dateInput: 'DD/MM/YYYY',
          monthYearLabel: 'MMMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    }
  ],
  templateUrl: './nuevo-paciente.component.html',
  styleUrls: ['./nuevo-paciente.component.css']
})
export class NuevoPacienteComponent {
  generos: any[] = [];
  dniControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(8), // Máximo de 8 caracteres
    Validators.pattern(/^\d+$/) // Solo números
  ]);
  apellidoControl = new FormControl({ value: '', disabled: true }, Validators.required); // Apellido deshabilitado inicialmente
  nombreControl = new FormControl({ value: '', disabled: true }, Validators.required);
  provinciaControl = new FormControl({ value: null, disabled: true }, Validators.required);
  ciudadControl = new FormControl({ value: null, disabled: true }, Validators.required);
  escuelaControl = new FormControl<any>({ value: null, disabled: true });
  fechaNacimientoControl = new FormControl({ value: '', disabled: true }, Validators.required);
  obraSocialControl = new FormControl<any>({ value: null, disabled: true });
  observacionesControl = new FormControl({ value: '', disabled: true });
  tieneObraSocialControl = new FormControl({ value: false, disabled: true }); // Toggle deshabilitado inicialmente
  estaEscolarizadoControl = new FormControl({ value: false, disabled: true }); // Toggle deshabilitado inicialmente
  generoControl = new FormControl<any>({ value: null, disabled: true }, Validators.required);
  telefonoControl = new FormControl({ value: null, disabled: true }, [
    Validators.pattern(/^\d{10}$/) // Validar un número de 10 dígitos
  ]);
  mailControl = new FormControl({ value: null, disabled: true }, [
    Validators.email // Validar formato de correo electrónico
  ]);

  // Formulario completo
  pacienteForm = new FormGroup({
    dni: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    apellido: new FormControl('', Validators.required),
    nombre: new FormControl('', Validators.required),
    fechaNacimiento: new FormControl('', Validators.required),
    genero: new FormControl('', Validators.required),
    provincia: new FormControl(null),
    ciudad: new FormControl(null),
    escuela: new FormControl(null),
    obraSocial: new FormControl(null),
    observaciones: new FormControl(''),
    telefono: this.telefonoControl, // Sin Validators.required
    mail: this.mailControl // Sin Validators.required
  });

  provinciasFiltradas: any[] = [];
  ciudadesFiltradas: any[] = [];
  escuelasFiltradas: any[] = [];
  obrasSocialesFiltradas: any[] = [];
  provinciaSeleccionada: any = null;
  ciudadSeleccionada: any = null;
  mensajeError: string | null = null; // Parece que no se utiliza en el flujo actual
  ciudadValida: boolean = false;
  mostrarBotonEditar: boolean = false;

  mostrarNombreProvincia = (provincia: any): string => {
    return provincia?.Provincia || '';
  };

  mostrarNombreCiudad(ciudad: any): string {
    return ciudad?.Ciudad || '';
  }

  mostrarNombreObraSocial(obra: any): string {
    return obra?.Nombre || '';
  }

  mostrarNombreEscuela(escuela: any): string {
    return escuela?.Nombre || '';
  }

  capitalizarTexto(control: FormControl) {
    const valor = control.value || '';
    const capitalizado = valor
      .toLowerCase()
      .replace(/\b\w/g, (letra: string) => letra.toUpperCase());
      control.setValue(capitalizado, { emitEvent: false });
  }

  validarFechaNacimiento = (fecha: Date | null): boolean => {
    if (!fecha) {
      return false;
    }

    const hoy = new Date();
    return fecha < hoy; // Permitir solo fechas anteriores a hoy
  };

  constructor(
    private router: Router,
    private ubicacionService: UbicacionService,
    private obraSocialService: ObraSocialService,
    private escuelaService: EscuelaService,
    private pacienteService: PacienteService,
    private generoService: GeneroService,
    private snackBar: MatSnackBar
  ) {
    // Escuchar cambios en el campo DNI
    this.dniControl.valueChanges.subscribe((valor) => {
      if (valor && valor.toString().length === 8) {
        this.apellidoControl.enable();
      } else {
        this.apellidoControl.disable();
        this.apellidoControl.setValue('');
      }
    });

    // Escuchar cambios en el campo Apellido
    this.apellidoControl.valueChanges.subscribe((valor) => {
      if (valor && valor.trim().length > 0) {
        this.nombreControl.enable();
      } else {
        this.nombreControl.disable();
        this.nombreControl.setValue('');
      }
    });

    // Escuchar cambios en el campo Nombre
    this.nombreControl.valueChanges.subscribe((valor) => {
      if (valor && valor.trim().length > 0) {
        this.fechaNacimientoControl.enable();
      } else {
        this.fechaNacimientoControl.disable();
        this.fechaNacimientoControl.setValue('');
      }
    });

    // Escuchar cambios en el campo Fecha de Nacimiento
    this.fechaNacimientoControl.valueChanges.subscribe((valor) => {
      if (valor) {
        this.generoControl.enable(); // Habilitar el campo Género
      } else {
        this.generoControl.disable();
        this.generoControl.setValue(null);
      }
    });

    // Escuchar cambios en el campo Género
    this.generoControl.valueChanges.subscribe((valor) => {
      if (valor) {
        this.provinciaControl.enable(); // Habilitar el campo Provincia
      } else {
        this.provinciaControl.disable();
        this.provinciaControl.setValue(null);
      }
    });

    // Escuchar cambios en el campo Provincia
    this.provinciaControl.valueChanges.subscribe((valor) => {
      if (valor) {
        this.ciudadControl.enable();
      } else {
        this.ciudadControl.disable();
        this.ciudadControl.setValue(null);
      }
    });

    // Escuchar cambios en el campo Ciudad
    this.ciudadControl.valueChanges.subscribe(() => {
      this.actualizarEstadoToggles();
    });

    // Escuchar cambios en el toggle "¿Está escolarizado?"
    this.estaEscolarizadoControl.valueChanges.subscribe((estado) => {
      if (estado) {
        this.escuelaControl.enable();
      } else {
        this.escuelaControl.disable();
        this.escuelaControl.setValue(null);
        this.escuelasFiltradas = [];
      }
    });

    // Escuchar cambios en el toggle "¿Tiene obra social?"
    this.tieneObraSocialControl.valueChanges.subscribe((estado) => {
      if (estado) {
        this.obraSocialControl.enable();
      } else {
        this.obraSocialControl.disable();
        this.obraSocialControl.setValue(null);
        this.obrasSocialesFiltradas = [];
      }
    });
  }

  ngOnInit(): void {
    this.cargarGeneros(); // Llamar al método para cargar los géneros
  }

  filtrarProvincias() {
    const valor = this.provinciaControl.value || '';
    if (valor.length < 2) {
      this.provinciasFiltradas = [];
      return;
    }
    this.ubicacionService.buscarProvincias(valor).subscribe(provincias => {
      this.provinciasFiltradas = provincias;
    });
  }

  seleccionarProvincia(provincia: any) {
    this.provinciaSeleccionada = provincia; // Guardar la provincia seleccionada
    this.provinciaControl.setValue(provincia); // Establecer el objeto completo como valor del control
    this.ciudadControl.setValue(null); // Limpiar el campo Ciudad
    this.ciudadesFiltradas = []; // Limpiar las ciudades filtradas
  }

  filtrarCiudades() {
    const valor = this.ciudadControl.value || '';
    if (!this.provinciaSeleccionada || valor.length < 2) {
      this.ciudadesFiltradas = [];
      return;
    }
    this.ubicacionService.buscarCiudadesPorProvincia(this.provinciaSeleccionada.ID, valor)
      .subscribe(ciudades => {
        console.log('✅ Ciudades recibidas:', ciudades);
        this.ciudadesFiltradas = ciudades;
      });
  }

  seleccionarCiudad(ciudad: any) {
    this.ciudadSeleccionada = ciudad; // Guardar la ciudad seleccionada
    this.ciudadControl.setValue(ciudad); // Establecer el objeto completo como valor del control
    this.escuelasFiltradas = []; // Limpiar las escuelas filtradas
  }

  filtrarObrasSociales() {
    const valor = this.obraSocialControl.value || '';
    if (valor.length < 2) {
      this.obrasSocialesFiltradas = [];
      return;
    }
    this.obraSocialService.buscarObrasSociales(valor).subscribe(obras => {
      this.obrasSocialesFiltradas = obras;
    });
  }

  seleccionarObraSocial(obra: any) {
    this.obraSocialControl.setValue(obra);
    console.log('Obra social seleccionada:', obra);
  }

  filtrarEscuelas() {
    const valor = this.escuelaControl.value || '';
    if (!this.ciudadSeleccionada || valor.length < 2) {
      this.escuelasFiltradas = [];
      return;
    }
    this.escuelaService.buscarEscuelasPorCiudad(this.ciudadSeleccionada.ID, valor)
      .subscribe(
        (escuelas) => {
          console.log('✅ Escuelas recibidas:', escuelas); // Verificar los datos en la consola
          this.escuelasFiltradas = escuelas;
        },
        (error) => {
          console.error('❌ Error al cargar las escuelas:', error); // Verificar errores
        }
      );
  }

  seleccionarEscuela(escuela: any) {
    this.escuelaControl.setValue(escuela);
    console.log('Escuela seleccionada:', escuela);
  }

  validarProvincia() {
    const valor = this.provinciaControl.value;
    // Verificar si el valor es un objeto válido de la lista
    const provinciaValida = this.provinciasFiltradas.some(
      (provincia) => provincia === valor
    );
    if (!provinciaValida) {
      // Si no es válido, limpiar el campo
      this.provinciaControl.setValue(null);
      this.provinciaSeleccionada = null;
      this.ciudadControl.disable();
      this.ciudadControl.setValue(null);
      this.ciudadesFiltradas = [];
    }
  }

  validarCiudad() {
    const valor = this.ciudadControl.value;

    // Verificar si el valor es un objeto válido de la lista
    this.ciudadValida = this.ciudadesFiltradas.some(
      (ciudad) => ciudad === valor
    );

    if (!this.ciudadValida) {
      // Si no es válido, limpiar el campo
      this.ciudadControl.setValue(null);
      this.ciudadSeleccionada = null;
      this.escuelaControl.disable();
      this.escuelaControl.setValue(null);
      this.escuelasFiltradas = [];
      this.obraSocialControl.disable();
      this.obraSocialControl.setValue(null);
      this.obrasSocialesFiltradas = [];
    }
  }

  validarEscuela() {
    const valor = this.escuelaControl.value;

    // Verificar si el valor es un objeto válido de la lista
    const escuelaValida = this.escuelasFiltradas.some(
      (escuela) => escuela === valor
    );

    if (!escuelaValida) {
      // Si no es válido, limpiar el campo
      this.escuelaControl.setValue(null);
    }
  }

  validarObraSocial() {
    const valor = this.obraSocialControl.value;

    // Verificar si el valor es un objeto válido de la lista
    const obraSocialValida = this.obrasSocialesFiltradas.some(
      (obra) => obra === valor
    );

    if (!obraSocialValida) {
      // Si no es válido, limpiar el campo
      this.obraSocialControl.setValue(null);
    }
  }

  toggleObraSocial(estado: boolean) {
    if (estado) {
      this.obraSocialControl.enable(); // Habilitar el campo si el switch está activado
    } else {
      this.obraSocialControl.disable(); // Deshabilitar el campo si el switch está desactivado
      this.obraSocialControl.setValue(null); // Limpiar el valor del campo
      this.obrasSocialesFiltradas = []; // Limpiar las opciones filtradas
    }
  }

  toggleEscolarizado(estado: boolean) {
    if (estado) {
      this.escuelaControl.enable(); // Habilitar el campo si el toggle está activado
    } else {
      this.escuelaControl.disable(); // Deshabilitar el campo si el toggle está desactivado
      this.escuelaControl.setValue(null); // Limpiar el valor del campo
      this.escuelasFiltradas = []; // Limpiar las opciones filtradas
    }
  }

  actualizarEstadoToggleObraSocial() {
    if (this.estaEscolarizadoControl.disabled) {
      // Escenario 1: El toggle "¿Está escolarizado?" está deshabilitado
      this.tieneObraSocialControl.enable();
    } else {
      // Escenario 2: El toggle "¿Está escolarizado?" está habilitado y se seleccionó una escuela válida
      const escuelaValida = this.escuelasFiltradas.some(
        (escuela) => escuela === this.escuelaControl.value
      );

      if (escuelaValida) {
        this.tieneObraSocialControl.enable();
      } else {
        this.tieneObraSocialControl.disable();
        this.tieneObraSocialControl.setValue(false); // Reiniciar el toggle
      }
    }
  }

  actualizarEstadoToggles() {
    const ciudadValida = this.ciudadesFiltradas.some(
      (ciudad) => ciudad === this.ciudadControl.value
    );

    if (ciudadValida) {
      // Si la ciudad es válida, habilitar ambos toggles, el campo "Observaciones", "Teléfono" y "Mail"
      this.estaEscolarizadoControl.enable();
      this.tieneObraSocialControl.enable();
      this.observacionesControl.enable();
      this.telefonoControl.enable(); // Habilitar Teléfono
      this.mailControl.enable(); // Habilitar Mail
    } else {
      // Si la ciudad no es válida, deshabilitar ambos toggles, el campo "Observaciones", "Teléfono" y "Mail"
      this.estaEscolarizadoControl.disable();
      this.estaEscolarizadoControl.setValue(false); // Reiniciar el toggle
      this.tieneObraSocialControl.disable();
      this.tieneObraSocialControl.setValue(false); // Reiniciar el toggle
      this.observacionesControl.disable();
      this.observacionesControl.setValue(''); // Limpiar el campo
      this.telefonoControl.disable(); // Deshabilitar Teléfono
      this.telefonoControl.setValue(null); // Limpiar el campo Teléfono
      this.mailControl.disable(); // Deshabilitar Mail
      this.mailControl.setValue(null); // Limpiar el campo Mail

      // También deshabilitar los campos dependientes
      this.escuelaControl.disable();
      this.escuelaControl.setValue(null);
      this.escuelasFiltradas = [];
      this.obraSocialControl.disable();
      this.obraSocialControl.setValue(null);
      this.obrasSocialesFiltradas = [];
    }
  }

  verificarDni() {
    const dni = this.dniControl.value;

    // Verificar que el DNI tenga exactamente 8 caracteres
    if (dni && dni.toString().length === 8) {
      this.pacienteService.buscarPacientes(dni).subscribe(
        (response: any[]) => {
          if (response && response.length > 0) {
            this.mensajeError = 'El DNI ya está registrado.';
            this.apellidoControl.disable(); // Deshabilitar el campo "Apellido"
            this.mostrarBotonEditar = true; // Mostrar el botón Editar
          } else {
            this.mensajeError = null;
            this.apellidoControl.enable(); // Habilitar el campo "Apellido" si el DNI no existe
            this.mostrarBotonEditar = false; // Ocultar el botón Editar
          }
        },
        (error) => {
          console.error('Error al verificar el DNI:', error);
          this.mensajeError = 'Error al verificar el DNI.';
          this.apellidoControl.disable(); // Deshabilitar el campo en caso de error
          this.mostrarBotonEditar = false; // Ocultar el botón Editar
        }
      );
    } else {
      // Si el DNI no tiene 8 caracteres, deshabilitar el campo "Apellido"
      this.mensajeError = null;
      this.apellidoControl.disable();
      this.apellidoControl.setValue('');
      this.mostrarBotonEditar = false; // Ocultar el botón Editar
    }
  }

  cargarGeneros() {
    this.generoService.obtenerGeneros().subscribe(
      (generos) => {
        console.log('Géneros cargados:', generos); // Verifica que los datos tengan la propiedad "ID"
        this.generos = generos;
      },
      (error) => {
        console.error('Error al cargar los géneros:', error);
      }
    );
  }

  guardarPaciente() {
    const fechaNacimientoISO = this.fechaNacimientoControl.value
      ? new Date(this.fechaNacimientoControl.value).toISOString().split('T')[0]
      : null;
    const paciente = {
      dni: this.dniControl.value,
      apellido: this.apellidoControl.value,
      nombre: this.nombreControl.value,
      fechaNacimiento: fechaNacimientoISO,
      idGenero: this.generoControl.value && typeof this.generoControl.value === 'object'
        ? this.generoControl.value.ID
        : null,
      idCiudad: this.ciudadSeleccionada?.ID || null,
      telefono: this.telefonoControl.value ? `+549${this.telefonoControl.value}` : null,
      email: this.mailControl.value || null,
      idObraSocial: this.tieneObraSocialControl.value ? this.obraSocialControl.value?.ID : null,
      idEscuela: this.estaEscolarizadoControl.value ? this.escuelaControl.value?.ID : null,
      observaciones: this.observacionesControl.value || null,
      idEstado: 1 // Estado por defecto
    };

    this.pacienteService.insertarPaciente(paciente).subscribe(
      (response) => {
        console.log('Paciente guardado con éxito:', response);
        this.snackBar.open('Paciente guardado satisfactoriamente', 'Cerrar', {
          duration: 3000, // Duración del mensaje en milisegundos
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        this.router.navigate(['/pacientes']); // Redirigir a la lista de pacientes
      },
      (error) => {
        console.error('Error al guardar el paciente:', error);
        this.snackBar.open('Error al guardar el paciente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      }
    );
  }

  limpiarFormulario() {
    location.reload();
  }

  cancelar() {
    this.router.navigate(['/pacientes']); // Redirigir a la ruta de "Pacientes"
  }
}


