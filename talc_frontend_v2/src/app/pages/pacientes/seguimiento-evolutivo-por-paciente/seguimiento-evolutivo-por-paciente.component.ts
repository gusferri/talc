/**
 * Componente para gestión de seguimiento evolutivo por paciente
 * 
 * Este componente permite a los profesionales consultar y gestionar
 * los informes evolutivos asociados a cada paciente, incluyendo
 * informes específicos por área e informes interdisciplinarios.
 * 
 * Funcionalidades principales:
 * - Búsqueda y selección de pacientes
 * - Visualización de informes evolutivos
 * - Generación de informes con IA
 * - Edición de informes existentes
 * - Filtrado por tipo de informe y profesional
 * - Interfaz dual para gestión de informes
 */

// Importaciones de Angular Core
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

// Importaciones de Angular Forms
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';

// Importaciones de Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// Importaciones de servicios
import { PacienteService } from '../../../services/paciente.service';
import { InformesService } from '../../../services/informes.service';

// Importaciones de RxJS
import { debounceTime, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// Importaciones de componentes de diálogo
import { DialogInformeEvolutivoComponent } from './dialog-informe-evolutivo.component';

/**
 * Componente principal para gestión de seguimiento evolutivo
 * Permite consultar, generar y editar informes evolutivos de pacientes
 */
@Component({
  selector: 'app-seguimiento-evolutivo-por-paciente',
  standalone: true,
  templateUrl: './seguimiento-evolutivo-por-paciente.component.html',
  styleUrls: ['./seguimiento-evolutivo-por-paciente.component.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatTableModule,
    ReactiveFormsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatButtonModule
  ]
})
export class SeguimientoEvolutivoPorPacienteComponent implements OnInit {
  /** Control del formulario para búsqueda de pacientes */
  pacienteControl = new FormControl('');

  /** Lista completa de pacientes del profesional */
  pacientes: any[] = [];

  /** Lista filtrada de pacientes para autocompletado */
  pacientesFiltrados: any[] = [];

  /** Paciente actualmente seleccionado */
  pacienteSeleccionado: any = null;

  /** Lista de informes del paciente seleccionado */
  informes: any[] = [];

  /** Columnas a mostrar en la tabla de informes */
  displayedColumns = ['fecha', 'tipoInforme', 'profesional', 'acciones'];

  /** Estado de carga de datos */
  isLoading: boolean = false;

  /** Informe seleccionado para edición */
  informeSeleccionado: any = null;

  /** Servicio de pacientes inyectado */
  private pacienteService = inject(PacienteService);

  /** Servicio de informes inyectado */
  private informesService = inject(InformesService);

  /** Servicio de diálogos de Material */
  private dialog: MatDialog;

  /** Servicio de rutas para obtener parámetros */
  private route: ActivatedRoute;

  /**
   * Constructor del componente
   * Inicializa los servicios necesarios para diálogos y rutas
   */
  constructor(dialog: MatDialog, route: ActivatedRoute, private snackBar: MatSnackBar) {
    this.dialog = dialog;
    this.route = route;
  }

  /**
   * Hook del ciclo de vida - se ejecuta al inicializar el componente
   * Carga los pacientes del profesional y configura la búsqueda
   */
  ngOnInit(): void {
    // Obtener el username del profesional desde localStorage
    const shortname = localStorage.getItem('username');
    if (shortname) {
      // Cargar pacientes asociados al profesional
      this.pacienteService.obtenerPacientesPorProfesional(shortname).subscribe((pacientes: any[]) => {
        this.pacientes = pacientes;
        this.pacientesFiltrados = pacientes;

        // Verificar si hay un pacienteId en los query params para selección automática
        this.route.queryParams.subscribe(params => {
          const pacienteId = params['pacienteId'];
          if (pacienteId) {
            const paciente = pacientes.find(p => p.ID == pacienteId || p.id == pacienteId);
            if (paciente) {
              this.pacienteControl.setValue(paciente);
              this.onPacienteSeleccionado({ option: { value: paciente } });
            }
          }
        });
      });
    }

    // Configurar búsqueda reactiva con debounce
    this.pacienteControl.valueChanges
      .pipe(
        debounceTime(300), // Esperar 300ms después del último cambio
        switchMap(value => {
          if (typeof value === 'string' && value.length > 0) {
            const filtro = value.toLowerCase();
            return of(
              this.pacientes.filter(p =>
                (`${p.Nombre} ${p.Apellido}`.toLowerCase().includes(filtro) ||
                 `${p.Apellido} ${p.Nombre}`.toLowerCase().includes(filtro))
              )
            );
          } else {
            // Si es objeto, mostrar todos los pacientes
            return of(this.pacientes);
          }
        })
      )
      .subscribe((pacientes: any[]) => {
        this.pacientesFiltrados = pacientes;
      });
  }

  /**
   * Función helper para mostrar el nombre del paciente en el autocompletado
   *
   * @param paciente - Objeto paciente
   * @returns String formateado con apellido y nombre
   */
  displayPaciente(paciente: any): string {
    return paciente && paciente.Apellido ? `${paciente.Apellido}, ${paciente.Nombre}` : '';
  }

  /**
   * Maneja la selección de un paciente del autocompletado
   * Carga los informes asociados al paciente seleccionado
   *
   * @param event - Evento de selección del autocompletado
   */
  onPacienteSeleccionado(event: any) {
    const paciente = event.option.value;
    this.pacienteSeleccionado = paciente;
    this.informeSeleccionado = null;

    if (paciente && paciente.ID) {
      this.isLoading = true;
      const username = localStorage.getItem('username');
      
      // Obtener información del profesional logueado
      this.pacienteService.obtenerProfesionalPorUsername(username || '').subscribe((profesional: any) => {
        const idProfesional = profesional?.ID;
        
        // Cargar informes del paciente
        this.informesService.getInformesPorPaciente(paciente.ID).subscribe({
          next: (informes: any) => {
            // Procesar la respuesta del servicio
            const lista = Array.isArray(informes) ? informes : (informes && (informes as any).informes ? (informes as any).informes : []);
            
            // Filtrar informes según permisos:
            // - Interdisciplinarios (TipoInforme === 2): visibles para todos
            // - Específicos (TipoInforme === 1): solo del profesional logueado
            this.informes = lista.filter((i: any) =>
              (i.TipoInforme === 2) || (i.TipoInforme === 1 && i.ID_Profesional === idProfesional)
            );
            this.isLoading = false;
          },
          error: () => {
            this.informes = [];
            this.isLoading = false;
          }
        });
      });
    } else {
      this.informes = [];
    }
  }

  /**
   * Abre el diálogo para visualizar y editar un informe evolutivo
   *
   * @param informe - Informe a visualizar/editar
   */
  abrirDialogInforme(informe: any) {
    this.dialog.open(DialogInformeEvolutivoComponent, {
      data: {
        informe,
        paciente: this.pacienteSeleccionado
      },
      width: '600px'
    });
  }

  /**
   * Guarda la edición del informe seleccionado
   * Función placeholder para funcionalidad futura
   */
  guardarEdicionInforme() {
    // Lógica para guardar la edición del informe
    // Por ahora, solo simula la funcionalidad
    alert('Edición de informe guardada (simulado)');
  }

  /**
   * Limpia el formulario de edición
   * Resetea el informe seleccionado
   */
  limpiarFormulario() {
    this.informeSeleccionado = null;
  }

  /**
   * Genera un nuevo informe evolutivo usando IA
   * Puede ser específico por área o interdisciplinario
   *
   * @param tipo - Tipo de informe a generar ('area' | 'interdisciplinario')
   */
  generarInforme(tipo: 'area' | 'interdisciplinario') {
    if (!this.pacienteSeleccionado) {
      this.snackBar.open('Selecciona un paciente primero.', 'Cerrar', { duration: 3000 });
      return;
    }

    const username = localStorage.getItem('username');
    
    // Obtener información del profesional logueado
    this.pacienteService.obtenerProfesionalPorUsername(username || '').subscribe((profesional: any) => {
      const idProfesional = profesional?.ID;
      
      if (!idProfesional) {
        this.snackBar.open('No se pudo obtener el profesional logueado.', 'Cerrar', { duration: 3000 });
        return;
      }

      // Preparar payload para la generación del informe
      const payload = {
        ID_Paciente: this.pacienteSeleccionado.ID,
        ID_Profesional: idProfesional,
        TipoInforme: tipo
      };

      // Llamar al servicio para generar el informe con IA
      this.informesService.createInformeIA(payload).subscribe({
        next: (res) => {
          this.snackBar.open('Informe generado correctamente.', 'Cerrar', { duration: 2500 });
          // Recargar informes para mostrar el nuevo
          this.onPacienteSeleccionado({ option: { value: this.pacienteSeleccionado } });
        },
        error: (err) => {
          this.snackBar.open('Error al generar informe.', 'Cerrar', { duration: 4000 });
        }
      });
    });
  }
} 