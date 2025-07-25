/**
 * Componente para gestión de notas de voz por paciente
 * 
 * Este componente permite a los profesionales consultar y gestionar
 * las notas de voz asociadas a los turnos de cada paciente.
 * 
 * Funcionalidades principales:
 * - Búsqueda y selección de pacientes
 * - Visualización de turnos con estado de notas de voz
 * - Reproducción y edición de transcripciones existentes
 * - Grabación de nuevas notas de voz
 * - Interfaz dual para gestión de transcripciones
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

// Importaciones de servicios
import { PacienteService } from '../../../services/paciente.service';
import { NotasVozService } from '../../../services/notas-voz.service';

// Importaciones de RxJS
import { debounceTime, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// Importaciones de componentes de diálogo
import { DialogNotaVozComponent } from './dialog-nota-voz.component';
import { DialogGrabarNotaVozComponent } from './dialog-grabar-nota-voz.component';

/**
 * Componente principal para gestión de notas de voz por paciente
 * Permite consultar, reproducir y gestionar las notas de voz de los turnos
 */
@Component({
  selector: 'app-notas-voz-por-paciente',
  standalone: true,
  templateUrl: './notas-voz-por-paciente.component.html',
  styleUrls: ['./notas-voz-por-paciente.component.scss'],
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
export class NotasVozPorPacienteComponent implements OnInit {
  /** Control del formulario para búsqueda de pacientes */
  pacienteControl = new FormControl('');
  
  /** Lista completa de pacientes del profesional */
  pacientes: any[] = [];
  
  /** Lista filtrada de pacientes para autocompletado */
  pacientesFiltrados: any[] = [];
  
  /** Paciente actualmente seleccionado */
  pacienteSeleccionado: any = null;
  
  /** Lista de turnos del paciente seleccionado */
  turnos: any[] = [];
  
  /** Columnas a mostrar en la tabla de turnos */
  displayedColumns = ['fecha', 'hora', 'notaVoz', 'acciones'];
  
  /** Estado de carga de datos */
  isLoading: boolean = false;
  
  /** Servicio de pacientes inyectado */
  private pacienteService = inject(PacienteService);
  
  /** Sesión/turno seleccionado para transcripción */
  sesionSeleccionada: any = null;
  
  /** Texto de la transcripción actual */
  transcripcion: string = '';
  
  /** ID de la nota de voz actual */
  idNotaVoz: number | null = null;
  
  /** Servicio de diálogos de Material */
  private dialog: MatDialog;
  
  /** Servicio de notas de voz inyectado */
  private notasVozService = inject(NotasVozService);
  
  /** Servicio de rutas para obtener parámetros */
  private route: ActivatedRoute;

  /**
   * Constructor del componente
   * Inicializa los servicios necesarios para diálogos y rutas
   */
  constructor(dialog: MatDialog, route: ActivatedRoute) {
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
          if (typeof value === 'string' && value.length > 1) {
            const filtro = value.toLowerCase();
            return of(
              this.pacientes.filter(p =>
                (`${p.Nombre} ${p.Apellido}`.toLowerCase().includes(filtro) ||
                 `${p.Apellido} ${p.Nombre}`.toLowerCase().includes(filtro))
              )
            );
          } else {
            return of([]);
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
    return paciente ? `${paciente.Apellido}, ${paciente.Nombre}` : '';
  }

  /**
   * Maneja la selección de un paciente del autocompletado
   * Carga los turnos asociados al paciente seleccionado
   * 
   * @param event - Evento de selección del autocompletado
   */
  onPacienteSeleccionado(event: any) {
    const paciente = event.option.value;
    this.pacienteSeleccionado = paciente;
    
    if (paciente && paciente.ID) {
      // Cargar turnos del paciente seleccionado
      this.pacienteService.obtenerTurnosPorPaciente(paciente.ID).subscribe((turnos: any[]) => {
        // Filtrar solo turnos en estado "Asistido" y agregar flag de nota de voz
        this.turnos = (turnos || []).filter(t => 
          t.EstadoTurno === 'Asistido' || t.EstadoTurno === 5 || 
          t.estado === 'Asistido' || t.estado === 5
        ).map(t => ({
          ...t,
          tieneNotaVoz: !!(t.ID_NotaVoz || t.id_nota_voz)
        }));
      });
    } else {
      this.turnos = [];
    }
  }

  /**
   * Abre el diálogo para editar una nota de voz existente
   * 
   * @param turno - Turno asociado a la nota de voz
   */
  abrirDialogNotaVoz(turno: any) {
    // Determinar el ID correcto de la nota de voz
    const idNotaVoz = turno.ID_NotaVoz || turno.id_nota_voz;
    console.log('Intentando obtener nota de voz para ID:', idNotaVoz, 'Turno:', turno);
    
    if (!idNotaVoz) {
      alert('No hay nota de voz asociada a este turno.');
      return;
    }
    
    // Abrir diálogo con estado de carga inicial
    const dialogRef = this.dialog.open(DialogNotaVozComponent, {
      data: {
        turno,
        paciente: this.pacienteSeleccionado,
        transcripcion: '',
        loading: true
      },
      width: '600px'
    });
    
    // Cargar la transcripción de la nota de voz
    this.notasVozService.obtenerNotasVoz(idNotaVoz).subscribe({
      next: (resp: any) => {
        console.log('Respuesta obtenerNotaVoz:', resp);
        // Actualizar la transcripción en el diálogo
        dialogRef.componentInstance.transcripcion = resp.texto || resp.transcripcion || resp.text || '';
        dialogRef.componentInstance.loading = false;
      },
      error: () => {
        // En caso de error, limpiar transcripción
        dialogRef.componentInstance.transcripcion = '';
        dialogRef.componentInstance.loading = false;
      }
    });
    
    // Manejar el cierre del diálogo
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.transcripcion !== undefined) {
        turno.transcripcion = result.transcripcion;
      }
    });
  }

  /**
   * Abre el diálogo para grabar una nueva nota de voz
   * 
   * @param turno - Turno para el cual grabar la nota
   */
  onGrabarNotaVoz(turno: any) {
    const dialogRef = this.dialog.open(DialogGrabarNotaVozComponent, {
      data: {
        turno,
        paciente: this.pacienteSeleccionado
      },
      width: '500px'
    });
    
    // Manejar el cierre del diálogo y refrescar datos si es necesario
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Si se grabó una nota de voz, refrescar los turnos del paciente
        if (this.pacienteSeleccionado && this.pacienteSeleccionado.ID) {
          this.pacienteService.obtenerTurnosPorPaciente(this.pacienteSeleccionado.ID).subscribe((turnos: any[]) => {
            this.turnos = (turnos || []).map(t => ({
              ...t,
              tieneNotaVoz: !!(t.ID_NotaVoz || t.id_nota_voz)
            }));
          });
        }
      }
    });
  }

  /**
   * Carga una nota de voz específica para edición
   * 
   * @param idNotaVoz - ID de la nota de voz a cargar
   * @param sesion - Sesión/turno asociado (opcional)
   */
  cargarNotaVoz(idNotaVoz: number, sesion?: any) {
    if (!idNotaVoz) return;
    
    if (sesion) {
      this.sesionSeleccionada = sesion;
    }
    
    // TODO: Implementar llamada real al servicio
    // this.notasVozService.obtenerNotaVoz(idNotaVoz).subscribe(resp => {
    //   this.transcripcion = resp.texto;
    //   this.idNotaVoz = idNotaVoz;
    // });
    
    // Simulación temporal
    this.transcripcion = 'Transcripción de ejemplo para la nota de voz.';
    this.idNotaVoz = idNotaVoz;
  }

  /**
   * Guarda la edición de la transcripción actual
   */
  guardarEdicionNotaVoz() {
    if (!this.idNotaVoz || !this.transcripcion) return;
    
    // TODO: Implementar llamada real al servicio
    // this.notasVozService.actualizarNotaVoz(this.idNotaVoz, this.transcripcion).subscribe(...)
    
    alert('Transcripción guardada (simulado)');
  }

  /**
   * Limpia el formulario de transcripción
   */
  limpiarFormulario() {
    this.transcripcion = '';
    this.idNotaVoz = null;
    this.sesionSeleccionada = null;
  }

  /**
   * Abre el diálogo para editar una nota de voz (método alternativo)
   * 
   * @param turno - Turno asociado a la nota de voz
   */
  editarNotaVoz(turno: any) {
    // Lógica para editar la nota de voz
    // TODO: Implementar funcionalidad completa
  }
} 