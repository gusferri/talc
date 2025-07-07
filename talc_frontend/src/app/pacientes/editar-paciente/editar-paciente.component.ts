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
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Router, ActivatedRoute } from '@angular/router';
import { GeneroService } from '../genero.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AdjuntarArchivoDialogComponent } from '../adjuntar-archivo-dialog/adjuntar-archivo-dialog.component';

import { forkJoin } from 'rxjs';


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
  templateUrl: './editar-paciente.component.html',
  styleUrls: ['./editar-paciente.component.css']
})
export class EditarPacienteComponent {
  pacienteSeleccionado: any; // Declarar la propiedad para almacenar el paciente seleccionado
  // Controles del formulario
  dniControl = new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]);
  fechaNacimientoControl = new FormControl({ value: '', disabled: true },);
  generoControl = new FormControl<{ ID: number; Nombre: string } | null>({ value: null, disabled: true });
  provinciaControl = new FormControl<{ ID: number; Provincia: string } | null>({ value: null, disabled: true });
  ciudadControl = new FormControl<{ ID: number; Ciudad: string } | null>({ value: null, disabled: true });
  escuelaControl = new FormControl<{ ID: number; Nombre: string } | null>({ value: null, disabled: true });
  obraSocialControl = new FormControl<{ ID: number; Nombre: string } | null>({ value: null, disabled: true });
  telefonoControl = new FormControl({ value: null, disabled: true }, [Validators.pattern(/^\d{10}$/)]);
  mailControl = new FormControl({ value: null, disabled: true }, [Validators.email]);
  observacionesControl = new FormControl({ value: '', disabled: true });
  apellidoNombreControl = new FormControl('', Validators.required); // Nuevo control
  editarFechaNacimientoControl = new FormControl({ value: false, disabled: true });
  editarGeneroControl = new FormControl({ value: false, disabled: true });
  editarProvinciaControl = new FormControl({ value: false, disabled: true });
  editarCiudadControl = new FormControl({ value: false, disabled: true });
  editarEscuelaControl = new FormControl({ value: false, disabled: true });
  editarObraSocialControl = new FormControl({ value: false, disabled: true });
  editarTelefonoControl = new FormControl({ value: false, disabled: true });
  editarMailControl = new FormControl({ value: false, disabled: true });
  editarObservacionesControl = new FormControl({ value: false, disabled: true });

  // Formulario completo
  pacienteForm = new FormGroup({
    dni: this.dniControl,
    apellidoNombre: this.apellidoNombreControl, // Nuevo control
    fechaNacimiento: this.fechaNacimientoControl,
    genero: this.generoControl,
    provincia: this.provinciaControl,
    ciudad: this.ciudadControl,
    escuela: this.escuelaControl,
    obraSocial: this.obraSocialControl,
    telefono: this.telefonoControl,
    mail: this.mailControl,
    observaciones: this.observacionesControl
  });

  // Variables para autocompletar
  pacientesFiltradosDni: any[] = [];
  pacientesFiltradosApellidoNombre: any[] = []; // Nueva lista
  provinciasFiltradas: any[] = [];
  ciudadesFiltradas: any[] = [];
  escuelasFiltradas: any[] = [];
  obrasSocialesFiltradas: any[] = [];
  generos: any[] = [];
  provincias: any[] = [];
  ciudades: any[] = [];
  obrasSociales: any[] = [];
  escuelas: any[] = [];
  provinciaSeleccionada: any = null;
  ciudadSeleccionada: any = null;
  ciudadValida: boolean = false;
  mensajeError: string | null = null;
  tieneObraSocialControl = new FormControl({ value: false, disabled: true });
  estaEscolarizadoControl = new FormControl({ value: false, disabled: true });
  editarPaciente = new FormControl({ value: false, disabled: true });
  guardarPacienteHabilitado: boolean = false;
  modoEdicion: boolean = false;
  escuelaSeleccionada: any = null;
  obraSocialSeleccionada: any = null;
  ciudadToggleChecked = false;
  adjuntarArchivoHabilitado: boolean = false;

  constructor(
    private router: Router,
    private ubicacionService: UbicacionService,
    private obraSocialService: ObraSocialService,
    private escuelaService: EscuelaService,
    private pacienteService: PacienteService,
    private generoService: GeneroService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private route: ActivatedRoute // Nuevo parámetro para obtener el DNI de la URL
  ) {}

  ngOnInit(): void {
    const dniDesdeRuta = this.route.snapshot.paramMap.get('dni');

    forkJoin([
      this.generoService.obtenerGeneros(),
      this.ubicacionService.obtenerProvincias(),
      this.ubicacionService.obtenerCiudades(),
      this.escuelaService.obtenerEscuelas(),
      this.obraSocialService.obtenerObrasSociales()
    ]).subscribe(([generos, provincias, ciudades, escuelas, obrasSociales]) => {
      this.generos = generos;
      this.provincias = provincias;
      this.ciudades = ciudades;
      this.escuelas = escuelas;
      this.obrasSociales = obrasSociales;

      if (dniDesdeRuta) {
        this.pacienteService.buscarPacientes(dniDesdeRuta).subscribe((pacientes: any[]) => {
          if (pacientes.length > 0) {
            this.seleccionarPaciente(pacientes[0]);
          }
        });
      }
    });

    // Listeners de toggles
    this.tieneObraSocialControl.valueChanges.subscribe((valor: boolean | null) => {
      if (this.modoEdicion) {
        if (valor ?? false) {
          this.obraSocialControl.enable();
        } else {
          this.obraSocialControl.disable();
          this.obraSocialControl.setValue(null);
        }
      }
    });

    this.estaEscolarizadoControl.valueChanges.subscribe((valor: boolean | null) => {
      if (this.modoEdicion) {
        if (valor ?? false) {
          this.escuelaControl.enable();
        } else {
          this.escuelaControl.disable();
          this.escuelaControl.setValue(null);
        }
      }
    });

    this.dniControl.valueChanges.subscribe((valor: string | null) => {
      this.validarPaciente(valor);
    });
  }

  buscarPacientePorDni(dni: string): void {
    console.log('Ejecutando buscarPacientePorDni con:', dni); // 👈 Agregá esto
    this.pacienteService.buscarPacientes(dni).subscribe(
      (pacientes: any[]) => {
        console.log('Pacientes encontrados:', pacientes);
        if (pacientes.length > 0) {
          const paciente = pacientes[0];
          this.pacienteForm.patchValue(paciente);
        } else {
          this.snackBar.open('Paciente no encontrado', 'Cerrar', { duration: 3000 });
        }
      },
      (error: any) => {
        console.error('Error al buscar paciente por DNI', error);
        this.snackBar.open('Error al buscar paciente', 'Cerrar', { duration: 3000 });
      }
    );
  }

  // Filtrar pacientes por DNI
  filtrarPacientesPorDni() {
    const valor = this.dniControl.value || '';
    if (valor.length < 2) {
      this.pacientesFiltradosDni = [];
      return;
    }
    this.pacienteService.buscarPacientes(valor).subscribe(
      (pacientes) => {
        this.pacientesFiltradosDni = pacientes;
      },
      (error) => {
        console.error('Error al buscar pacientes:', error);
      }
    );
  }

  // Método para filtrar pacientes por apellido y nombre
  filtrarPacientesPorApellidoNombre() {
    const valor = this.apellidoNombreControl.value || '';
    if (valor.length < 2) {
      this.pacientesFiltradosApellidoNombre = [];
      return;
    }
    this.pacienteService.buscarPacientes(valor).subscribe(
      (pacientes) => {
        this.pacientesFiltradosApellidoNombre = pacientes;
      },
      (error) => {
        console.error('Error al buscar pacientes por apellido y nombre:', error);
      }
    );
  }

  // Seleccionar un paciente y cargar sus datos en el formulario
  seleccionarPaciente(paciente: any) {
    console.log('Paciente seleccionado:', paciente);

    this.pacienteSeleccionado = paciente; // Asignar el paciente seleccionado

    // Eliminar "+549" del número de teléfono si existe
    const telefonoSinPrefijo = paciente.Telefono?.startsWith('+549')
      ? paciente.Telefono.slice(4)
      : paciente.Telefono;

    // Cargar los datos del paciente en los controles
    this.pacienteForm.patchValue({
      dni: paciente.DNI,
      apellidoNombre: `${paciente.Apellido}, ${paciente.Nombre}`,
      fechaNacimiento: paciente.FechaNacimiento,
      genero: paciente.ID_Genero,
      provincia: paciente.ID_Provincia,
      ciudad: paciente.ID_Ciudad,
      escuela: paciente.ID_Escuela,
      obraSocial: paciente.ID_ObraSocial,
      telefono: telefonoSinPrefijo,
      mail: paciente.Email,
      observaciones: paciente.Observaciones
    });

    // Reemplazar IDs por objetos completos en los campos que usan autocomplete

    // Género
    const generoSeleccionado = this.generos.find(g => g.ID === paciente.ID_Genero);
    this.generoControl.setValue(generoSeleccionado);

    // Ciudad
    const ciudadSeleccionada = this.ciudades.find(g => g.ID === paciente.ID_Ciudad);
    this.ciudadSeleccionada = ciudadSeleccionada;
    this.ciudadControl.setValue(ciudadSeleccionada);

    // Provincia
    const provinciaSeleccionada = this.provincias.find(p => p.ID === ciudadSeleccionada?.ID_Provincia);
    this.provinciaSeleccionada = provinciaSeleccionada;
    this.provinciaControl.setValue(provinciaSeleccionada);

    // Obra Social (si aplica)
    if (paciente.ID_ObraSocial) {
      const obraSocialSeleccionada = this.obrasSociales.find(o => o.ID === paciente.ID_ObraSocial);
      this.tieneObraSocialControl.setValue(true); // Activar el toggle
      this.obraSocialControl.setValue(obraSocialSeleccionada);
      //this.obraSocialControl.enable(); // Habilitar el campo
    } else {
      this.tieneObraSocialControl.setValue(false); // Desactivar el toggle
      this.obraSocialControl.setValue(null);
      this.obraSocialControl.disable(); // Deshabilitar el campo
    }

    // Escuela (si aplica)
    if (paciente.ID_Escuela) {
      const escuelaSeleccionada = this.escuelas.find(e => e.ID === paciente.ID_Escuela);
      this.estaEscolarizadoControl.setValue(true); // Activar el toggle
      this.escuelaControl.setValue(escuelaSeleccionada);
      //this.escuelaControl.enable(); // Habilitar el campo
    } else {
      this.estaEscolarizadoControl.setValue(false); // Desactivar el toggle
      this.escuelaControl.setValue(null);
      this.escuelaControl.disable(); // Deshabilitar el campo
    }

    // Habilitar todos los demás controles
  }

  // // Habilitar todos los controles del formulario
  // habilitarControles() {
  //   //this.apellidoControl.enable();
  //   //this.nombreControl.enable();
  //   //this.fechaNacimientoControl.enable();
  //   this.generoControl.enable();
  //   this.provinciaControl.enable();
  //   this.ciudadControl.enable();
  //   this.telefonoControl.enable();
  //   this.mailControl.enable();
  //   this.observacionesControl.enable();

  //   // Los controles dependientes de los toggles no se habilitan aquí
  //   this.tieneObraSocialControl.enable();
  //   this.estaEscolarizadoControl.enable();
  // }

  // Deshabilitar todos los controles del formulario
  // deshabilitarControles() {
  //   this.fechaNacimientoControl.disable();
  //   this.generoControl.disable();
  //   this.provinciaControl.disable();
  //   this.ciudadControl.disable();
  //   this.escuelaControl.disable();
  //   this.obraSocialControl.disable();
  //   this.telefonoControl.disable();
  //   this.mailControl.disable();
  //   this.observacionesControl.disable();

  //   // Los toggles también deben estar deshabilitados
  //   this.tieneObraSocialControl.disable();
  //   this.estaEscolarizadoControl.disable();
  // }

  // Cargar géneros desde el backend
  cargarGeneros() {
    this.generoService.obtenerGeneros().subscribe(
      (generos) => {
        this.generos = generos;
      },
      (error) => {
        console.error('Error al cargar los géneros:', error);
      }
    );
  }

  cargarProvincias() {
    this.ubicacionService.obtenerProvincias().subscribe(
      (provincias) => {
        this.provincias = provincias;
      },
      (error) => {
        console.error('Error al cargar las provincias:', error);
      }
    );
  }

  cargarCiudades() {
    this.ubicacionService.obtenerCiudades().subscribe(
      (ciudades) => {
        this.ciudades = ciudades;
      },
      (error) => {
        console.error('Error al cargar las ciudades:', error);
      }
    );
  }

  cargarObrasSociales() {
    this.obraSocialService.obtenerObrasSociales ().subscribe(
      (obrasSociales) => {
        this.obrasSociales = obrasSociales;
      },
      (error) => {
        console.error('Error al cargar las obras sociales:', error);
      }
    );
  }
  
  cargarEscuelas() {
    this.escuelaService.obtenerEscuelas().subscribe(
      (escuelas) => {
        this.escuelas = escuelas;
      },
      (error) => {
        console.error('Error al cargar las escuelas:', error);
      }
    );
  }


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
    if (!fecha) return false;
    const hoy = new Date();
    return fecha < hoy;
  };

  filtrarProvincias() {
    const valor = typeof this.provinciaControl.value === 'string' ? this.provinciaControl.value : '';
    if (valor.length < 2) {
      this.provinciasFiltradas = [];
      return;
    }
    this.ubicacionService.buscarProvincias(valor).subscribe(provincias => {
      this.provinciasFiltradas = provincias;
    });
  }

  seleccionarProvincia(provincia: any) {
    this.provinciaSeleccionada = provincia;
    this.provinciaControl.setValue(provincia);
    this.ciudadControl.setValue(null);
    this.ciudadesFiltradas = [];
  }

  filtrarCiudades() {
    const valor = typeof this.ciudadControl.value === 'string' ? this.ciudadControl.value : '';
    if (!this.provinciaSeleccionada || valor.length < 2) {
      this.ciudadesFiltradas = [];
      return;
    }
    this.ubicacionService.buscarCiudadesPorProvincia(this.provinciaSeleccionada.ID, valor).subscribe(ciudades => {
      this.ciudadesFiltradas = ciudades;
    });
  }

  seleccionarCiudad(ciudad: any) {
    this.ciudadSeleccionada = ciudad;
    this.ciudadControl.setValue(ciudad);
    this.escuelasFiltradas = [];
  }

  filtrarObrasSociales() {
    const valor = typeof this.obraSocialControl.value === 'string' ? this.obraSocialControl.value : '';
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
  }

  filtrarEscuelas() {
    const valor = typeof this.escuelaControl.value === 'string' ? this.escuelaControl.value : '';
    if (!this.ciudadSeleccionada || valor.length < 2) {
      this.escuelasFiltradas = [];
      return;
    }
    this.escuelaService.buscarEscuelasPorCiudad(this.ciudadSeleccionada.ID, valor).subscribe(
      (escuelas) => {
        this.escuelasFiltradas = escuelas;
      },
      (error) => {
        console.error('Error al cargar las escuelas:', error);
      }
    );
  }

  seleccionarEscuela(escuela: any) {
    this.escuelaControl.setValue(escuela);
  }

  validarProvincia() {
    const valor = this.provinciaControl.value;

    // Si el valor actual ya es válido, no hacer nada
    if (this.provinciaSeleccionada && this.provinciaSeleccionada === valor) {
      return;
    }

    const provinciaValida = this.provinciasFiltradas.some(p => p === valor);

    if (!provinciaValida) {
      this.provinciaControl.setValue(null);
      this.provinciaSeleccionada = null;
      this.ciudadControl.disable(); // Deshabilitar el campo de ciudad
      this.ciudadControl.setValue(null);
      this.ciudadesFiltradas = [];
    }
  }

  validarCiudad() {
    const valor = this.ciudadControl.value;

    // Si el valor actual ya es válido, no hacer nada
    if (this.ciudadSeleccionada && this.ciudadSeleccionada === valor) {
      return;
    }

    this.ciudadValida = this.ciudadesFiltradas.some(c => c === valor);

    if (!this.ciudadValida) {
      this.ciudadControl.setValue(null);
      this.ciudadSeleccionada = null;
      this.escuelaControl.disable(); // Deshabilitar el campo de escuela
      this.escuelaControl.setValue(null);
      this.escuelasFiltradas = [];
      this.obraSocialControl.disable(); // Deshabilitar el campo de obra social
      this.obraSocialControl.setValue(null);
      this.obrasSocialesFiltradas = [];
    }
  }

  validarEscuela() {
    const valor = this.escuelaControl.value;

    // Si es null o vacío, no validar nada
    if (!valor) return;

    // Si el valor actual ya es válido, no hacer nada
    if (this.escuelaSeleccionada && (this.escuelaSeleccionada === valor || this.escuelaSeleccionada.Nombre === valor)) {
      return;
    }

    // Si no hay lista filtrada cargada, no modificar
    if (!this.escuelasFiltradas || this.escuelasFiltradas.length === 0) {
      return;
    }

    // Verificar si el valor coincide con alguna escuela en la lista filtrada
    const escuelaValida = this.escuelasFiltradas.some(e => e === valor || e.Nombre === valor);

    if (escuelaValida) {
      // Si es válido, actualizar la escuela seleccionada
      this.escuelaSeleccionada = this.escuelasFiltradas.find(e => e === valor || e.Nombre === valor) || null;
    } else {
      // Si no es válido, restaurar el valor anterior
      this.escuelaControl.setValue(this.escuelaSeleccionada?.Nombre || null, { emitEvent: false });
    }
  }

  validarObraSocial() {
    const valor = this.obraSocialControl.value;

    // Si es null o vacío, no validar nada
    if (!valor) return;

    // Si el valor actual ya es válido, no hacer nada
    if (this.obraSocialSeleccionada && (this.obraSocialSeleccionada === valor || this.obraSocialSeleccionada.Nombre === valor)) {
      return;
    }

    // Si no hay lista filtrada cargada, no modificar
    if (!this.obrasSocialesFiltradas || this.obrasSocialesFiltradas.length === 0) {
      return;
    }

    // Verificar si el valor coincide con alguna obra social en la lista filtrada
    const obraValida = this.obrasSocialesFiltradas.some(o => o === valor || o.Nombre === valor);

    if (obraValida) {
      // Si es válido, actualizar la obra social seleccionada
      this.obraSocialSeleccionada = this.obrasSocialesFiltradas.find(o => o === valor || o.Nombre === valor) || null;
    } else {
      // Si no es válido, restaurar el valor anterior
      this.obraSocialControl.setValue(this.obraSocialSeleccionada?.Nombre || null, { emitEvent: false });
    }
  }

  guardarPaciente() {
    if (this.pacienteForm.invalid) {
      this.snackBar.open('Por favor, complete todos los campos obligatorios.', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    const dni = this.dniControl.value || ''; // Asegurarse de que sea un string
    const fechaNacimientoISO = this.fechaNacimientoControl.value
      ? new Date(this.fechaNacimientoControl.value).toISOString().split('T')[0]
      : null;
      // Dividir el valor de apellidoNombreControl en apellido y nombre
    const apellidoNombre = this.apellidoNombreControl.value || '';
    const [apellido, nombre] = apellidoNombre.split(',').map(part => part.trim());


    const pacienteActualizado = {
      dni,
      apellido: apellido || null, // Enviar el apellido como variable separada
      nombre: nombre || null, // Enviar el nombre como variable separada
      fechaNacimiento: fechaNacimientoISO,
      idGenero: this.generoControl.value?.ID || null,
      idProvincia: this.provinciaControl.value?.ID || null,
      idCiudad: this.ciudadControl.value?.ID || null,
      idEscuela: this.escuelaControl.value?.ID || null,
      idObraSocial: this.obraSocialControl.value?.ID || null,
      telefono: this.telefonoControl.value ? `+549${this.telefonoControl.value}` : null,
      email: this.mailControl.value || null,
      observaciones: this.observacionesControl.value || null,
    };

    this.pacienteService.actualizarPaciente(dni, pacienteActualizado).subscribe(
      (response) => {
        this.snackBar.open('Paciente actualizado satisfactoriamente.', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.router.navigate(['/pacientes']);
      },
      (error) => {
        console.error('Error al actualizar el paciente:', error);
        this.snackBar.open('Error al actualizar el paciente.', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
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

    editarEscolarizado(event: MatSlideToggleChange) {
    const habilitar = event.checked; // `true` si el toggle está activado, `false` si está desactivado
    if (habilitar) {
      this.escuelaControl.enable(); // Habilitar el control
    } else {
      this.escuelaControl.disable(); // Deshabilitar el control
      this.escuelaControl.setValue(null); // Limpiar el valor del control
    }
  }

    editarTieneObraSocial(event: MatSlideToggleChange) {
    const habilitar = event.checked; // `true` si el toggle está activado, `false` si está desactivado
    if (habilitar) {
      this.obraSocialControl.enable(); // Habilitar el control
    } else {
      this.obraSocialControl.disable(); // Deshabilitar el control
      this.obraSocialControl.setValue(null); // Limpiar el valor del control
    }
  }

  editarFechaNacimiento(event: MatSlideToggleChange) {
    const habilitar = event.checked; // `true` si el toggle está activado, `false` si está desactivado

    if (habilitar) {
      this.fechaNacimientoControl.enable(); // Habilitar el control
    } else {
      this.fechaNacimientoControl.disable(); // Deshabilitar el control
    }
    this.verificarEstadoGuardar(); // Verificar el estado del botón Guardar
  }

  editarGenero(event: MatSlideToggleChange) {
    const habilitar = event.checked; // `true` si el toggle está activado, `false` si está desactivado

    if (habilitar) {
      this.generoControl.enable(); // Habilitar el control
    } else {
      this.generoControl.disable(); // Deshabilitar el control
    }
    this.verificarEstadoGuardar(); // Verificar el estado del botón Guardar
  }

  editarProvincia(event: MatSlideToggleChange) {
    const habilitar = event.checked; // `true` si el toggle está activado, `false` si está desactivado

    if (habilitar) {
      this.provinciaControl.enable(); // Habilitar el control
      this.ciudadToggleChecked = true; // Activar el toggle de ciudad
      this.editarCiudad({ checked: true } as MatSlideToggleChange); // Habilitar el control de ciudad también
    } else {
      this.provinciaControl.disable(); // Deshabilitar el control
      this.ciudadToggleChecked = false; // Desactivar el toggle de ciudad
      this.editarCiudad({ checked: false } as MatSlideToggleChange); // Habilitar el control de ciudad también
    }
    this.verificarEstadoGuardar(); // Verificar el estado del botón Guardar
  }

  editarCiudad(event: MatSlideToggleChange) {
    const habilitar = event.checked; // `true` si el toggle está activado, `false` si está desactivado
    if (habilitar) {
      this.ciudadControl.enable(); // Habilitar el control
    } else {
      this.ciudadControl.disable(); // Deshabilitar el control
    }
    this.verificarEstadoGuardar(); // Verificar el estado del botón Guardar
  }

  editarEscuela(event: MatSlideToggleChange) {
    const habilitar = event.checked; // `true` si el toggle está activado, `false` si está desactivado
    if (habilitar) {
      this.escuelaControl.enable(); // Habilitar el control
      this.estaEscolarizadoControl.enable(); // Habilitar el toggle de escuela
    } else {
      this.escuelaControl.disable(); // Deshabilitar el control
      this.estaEscolarizadoControl.disable(); 
    }
    this.verificarEstadoGuardar(); // Verificar el estado del botón Guardar
  }

  editarObraSocial(event: MatSlideToggleChange) {
    const habilitar = event.checked; // `true` si el toggle está activado, `false` si está desactivado
    if (habilitar) {
      this.obraSocialControl.enable(); // Habilitar el control
      this.tieneObraSocialControl.enable(); // Habilitar el toggle de obra social
    } else {
      this.obraSocialControl.disable(); // Deshabilitar el control
      this.tieneObraSocialControl.disable(); // Deshabilitar el toggle de obra social
    }
    this.verificarEstadoGuardar(); // Verificar el estado del botón Guardar
  }

  editarTelefono(event: MatSlideToggleChange) {
    const habilitar = event.checked; // `true` si el toggle está activado, `false` si está desactivado
    if (habilitar) {
      this.telefonoControl.enable(); // Habilitar el control
    } else {
      this.telefonoControl.disable(); // Deshabilitar el control
    }
    this.verificarEstadoGuardar(); // Verificar el estado del botón Guardar
  }

  editarMail(event: MatSlideToggleChange) {
    const habilitar = event.checked; // `true` si el toggle está activado, `false` si está desactivado
    if (habilitar) {
      this.mailControl.enable(); // Habilitar el control
    } else {
      this.mailControl.disable(); // Deshabilitar el control
    }
    this.verificarEstadoGuardar(); // Verificar el estado del botón Guardar
  }

  editarObservaciones(event: MatSlideToggleChange) {
    const habilitar = event.checked; // `true` si el toggle está activado, `false` si está desactivado
    if (habilitar) {
      this.observacionesControl.enable(); // Habilitar el control
    } else {
      this.observacionesControl.disable(); // Deshabilitar el control
    }
    this.verificarEstadoGuardar(); // Verificar el estado del botón Guardar
  }

  verificarEstadoGuardar() {
  const algunToggleHabilitado = 
    this.editarFechaNacimientoControl.value ||
    this.editarGeneroControl.value ||
    this.editarProvinciaControl.value ||
    this.editarCiudadControl.value ||
    this.editarEscuelaControl.value ||
    this.editarObraSocialControl.value ||
    this.editarTelefonoControl.value ||
    this.editarMailControl.value ||
    this.editarObservacionesControl.value;
    this.guardarPacienteHabilitado = !!algunToggleHabilitado; // Habilitar el botón si al menos un toggle está activo
  }

  validarPaciente(valor: string | null): void {
    const dniValido = !!(valor && /^\d+$/.test(valor) && valor.length >= 7); // Verificar si el DNI es válido

    if (dniValido) {
      this.editarFechaNacimientoControl.enable(); // Habilitar el toggle si el DNI es válido
      this.editarGeneroControl.enable(); // Habilitar el toggle de género
      this.editarProvinciaControl.enable(); // Habilitar el toggle de provincia
      this.editarCiudadControl.enable(); // Habilitar el toggle de ciudadi
      this.editarEscuelaControl.enable(); // Habilitar el toggle de escuela
      this.editarObraSocialControl.enable(); // Habilitar el toggle de obra social
      this.editarTelefonoControl.enable(); // Habilitar el toggle de teléfono
      this.editarMailControl.enable(); // Habilitar el toggle de mail
      this.editarObservacionesControl.enable(); // Habilitar el toggle de observaciones
      this.adjuntarArchivoHabilitado = true; // Habilitar el botón de adjuntar archivo
    } else {
      this.editarFechaNacimientoControl.disable(); // Deshabilitar el toggle si el DNI no es válido
      this.editarGeneroControl.disable(); // Deshabilitar el toggle de género
      this.editarProvinciaControl.disable(); // Deshabilitar el toggle de provincia
      this.editarCiudadControl.disable(); // Deshabilitar el toggle de ciudad
      this.editarEscuelaControl.disable(); // Deshabilitar el toggle de escuela
      this.editarObraSocialControl.disable(); // Deshabilitar el toggle de obra social
      this.editarTelefonoControl.disable(); // Deshabilitar el toggle de teléfono
      this.editarMailControl.disable(); // Deshabilitar el toggle de mail
      this.editarObservacionesControl.disable(); // Deshabilitar el toggle de observaciones
      this.editarFechaNacimientoControl.setValue(false); // Asegurarse de que el toggle esté en false
      this.editarGeneroControl.setValue(false); // Asegurarse de que el toggle esté en false
      this.editarProvinciaControl.setValue(false); // Asegurarse de que el toggle esté en false
      this.editarCiudadControl.setValue(false); // Asegurarse de que el toggle esté en false
      this.editarEscuelaControl.setValue(false); // Asegurarse de que el toggle esté en false
      this.editarObraSocialControl.setValue(false); // Asegurarse de que el toggle esté en false
      this.editarTelefonoControl.setValue(false); // Asegurarse de que el toggle esté en false
      this.editarMailControl.setValue(false); // Asegurarse de que el toggle esté en false
      this.editarObservacionesControl.setValue(false); // Asegurarse de que el toggle esté en false
      this.adjuntarArchivoHabilitado = false; // Deshabilitar el botón de adjuntar archivo
    }

    //this.guardarPacienteHabilitado = dniValido; // Actualizar el estado del botón Guardar
  }

  abrirDialogoAdjunto(): void {
    const dialogRef = this.dialog.open(AdjuntarArchivoDialogComponent, {
      width: '500px',
      data: {
        pacienteId: this.pacienteSeleccionado.ID
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Aquí podés subir el archivo result a la BD
        console.log('Archivo a subir:', result);
      }
    });
  }
}