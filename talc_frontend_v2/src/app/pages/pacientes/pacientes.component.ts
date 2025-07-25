/**
 * Componente Pacientes - Gestión principal de pacientes del sistema TALC
 * 
 * Este componente es el núcleo central para la gestión de pacientes en el sistema,
 * proporcionando una interfaz completa para administrar la información de pacientes
 * según el rol del usuario (secretaria o profesional).
 * 
 * Funcionalidades principales:
 * - Lista todos los pacientes del sistema (secretarias) o pacientes del profesional (profesionales)
 * - Búsqueda y filtrado avanzado de pacientes
 * - Ordenamiento dinámico por diferentes columnas
 * - Navegación contextual a funcionalidades específicas de cada paciente
 * - Gestión de documentación adjunta
 * - Control de acceso basado en roles
 * - Paginación optimizada para grandes volúmenes de datos
 * 
 * Responsabilidades:
 * - Cargar y mostrar la lista de pacientes según el rol del usuario
 * - Proporcionar interfaz intuitiva para búsqueda y ordenamiento
 * - Facilitar la navegación a otras funcionalidades relacionadas con pacientes
 * - Gestionar la paginación y estados de carga de la tabla
 * - Implementar control de acceso granular por roles
 * - Mantener consistencia en la presentación de datos
 * 
 * Arquitectura:
 * - Componente standalone con inyección de dependencias
 * - Integración con Material Design para UI consistente
 * - Manejo reactivo de estados y eventos
 * - Comunicación con servicios especializados
 */

// Importaciones necesarias para el componente Pacientes
// Component: Decorador que define la clase como un componente Angular
// OnInit: Interfaz para ejecutar código al inicializar el componente
// ViewChild: Decorador para acceder a elementos del template
// AfterViewInit: Interfaz para ejecutar código después de que se inicialice la vista
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';

// Router: Servicio para la navegación entre rutas de la aplicación
import { Router } from '@angular/router';

// CommonModule: Proporciona directivas comunes como *ngIf, *ngFor, etc.
import { CommonModule } from '@angular/common';

// Servicio para operaciones con pacientes
import { PacienteService } from '../../services/paciente.service';

// Importaciones de Material Design para la tabla y paginación
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';

// Importaciones de Material Design para UI components
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// FormsModule: Para formularios reactivos y template-driven
import { FormsModule } from '@angular/forms';

// RouterModule: Para navegación y enlaces
import { RouterModule } from '@angular/router';

// MatDialog: Para mostrar diálogos modales
import { MatDialog } from '@angular/material/dialog';

// Componente de diálogo para adjuntar archivos
import { AdjuntarArchivoDialogComponent } from './adjuntar-archivo-dialog.component';

/**
 * Componente principal para gestión de pacientes
 * Proporciona una interfaz completa para administrar pacientes según el rol del usuario
 */
@Component({
  standalone: true,                           // Componente standalone (no necesita módulo)
  selector: 'app-pacientes',                  // Selector CSS para usar el componente
  templateUrl: './pacientes.component.html',  // Template HTML del componente
  styleUrls: ['./pacientes.component.scss'],  // Archivo de estilos específico
  imports: [                                  // Módulos importados para este componente
    CommonModule, 
    MatTableModule, 
    MatPaginatorModule, 
    MatIconModule, 
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    FormsModule,
    RouterModule
  ],
})
export class PacientesComponent implements OnInit, AfterViewInit {
  /** Flag que indica si el usuario logueado es un profesional */
  esProfesional: boolean = false;
  
  /** DataSource de Material Table para manejar los datos de la tabla */
  pacientes: MatTableDataSource<any> = new MatTableDataSource<any>();
  
  /** Columnas que se muestran en la tabla de pacientes */
  displayedColumns: string[] = ['dni', 'nombre', 'apellido', 'edad', 'acciones'];
  
  /** Término de búsqueda para filtrar pacientes */
  searchTerm: string = '';
  
  /** Flag para controlar el estado de carga de datos */
  isLoading: boolean = false;
  
  /** Array que mantiene una copia de los datos originales para ordenamiento */
  datosOriginales: any[] = [];
  
  /** Variables para controlar el ordenamiento de la tabla */
  columnaOrden: string = '';                    // Columna por la cual se está ordenando
  direccionOrden: 'asc' | 'desc' = 'asc';       // Dirección del ordenamiento

  /** Referencia al paginador de Material Table */
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  /**
   * Constructor del componente
   * Inyecta los servicios necesarios para navegación, gestión de pacientes y diálogos
   * 
   * @param router - Servicio para navegación entre rutas
   * @param pacienteService - Servicio para operaciones con pacientes
   * @param dialog - Servicio para mostrar diálogos modales
   */
  constructor(
    public router: Router,                    // Servicio para navegación entre rutas
    private pacienteService: PacienteService, // Servicio para operaciones con pacientes
    private dialog: MatDialog                 // Servicio para mostrar diálogos modales
  ) {}

  /**
   * Método del ciclo de vida OnInit
   * Se ejecuta cuando el componente se inicializa
   * Responsable de verificar el rol del usuario y cargar los pacientes
   */
  ngOnInit(): void {
    this.verificarProfesionalYcargarPacientes();
  }

  /**
   * Método del ciclo de vida AfterViewInit
   * Se ejecuta después de que se inicialice la vista
   * Configura el paginador de la tabla
   */
  ngAfterViewInit(): void {
    this.pacientes.paginator = this.paginator;
  }

  /**
   * Verifica si el usuario es un profesional y carga los pacientes correspondientes
   * Adapta la información mostrada según el rol del usuario:
   * - Secretarias: Ven todos los pacientes del sistema
   * - Profesionales: Ven solo sus propios pacientes
   * 
   * Este método implementa control de acceso granular basado en roles
   */
  verificarProfesionalYcargarPacientes(): void {
    const shortname = localStorage.getItem('username');  // Obtiene el nombre de usuario
    if (shortname) {
      // Verifica si el usuario es un profesional consultando el backend
      this.pacienteService.esProfesionalPorShortname(shortname).subscribe({
        next: (res: any) => {
          this.esProfesional = res?.esProfesional === true;  // Actualiza el flag
          localStorage.setItem('esProfesional', JSON.stringify(this.esProfesional));  // Guarda en localStorage
          this.cargarPacientes();  // Carga los pacientes según el rol
        },
        error: (error: any) => {
          console.error('Error al verificar profesional', error);
          this.esProfesional = false;  // En caso de error, asume que no es profesional
          this.cargarPacientes();
        }
      });
    } else {
      this.cargarPacientes();  // Si no hay shortname, carga pacientes directamente
    }
  }

  /**
   * Carga los pacientes según el rol del usuario
   * Implementa lógica de control de acceso basada en roles:
   * - Secretarias: Obtienen todos los pacientes del sistema
   * - Profesionales: Obtienen solo sus pacientes asignados
   * 
   * Este método garantiza la privacidad y seguridad de los datos médicos
   */
  cargarPacientes(): void {
    this.isLoading = true;  // Activa el indicador de carga
    
    const rol = (localStorage.getItem('rol') || '').toLowerCase();  // Obtiene el rol del usuario
    const shortname = localStorage.getItem('username');             // Obtiene el nombre de usuario
    
    if (rol === 'secretaria') {
      // Las secretarias pueden ver todos los pacientes del sistema
      this.pacienteService.obtenerPacientes().subscribe({
        next: (pacientes: any[]) => {
          this.datosOriginales = [...pacientes];  // Guarda copia de los datos originales
          this.pacientes.data = pacientes;        // Actualiza la tabla
          this.isLoading = false;                 // Desactiva el indicador de carga
        },
        error: (error: any) => {
          console.error('Error al cargar pacientes', error);
          this.isLoading = false;
        }
      });
    } else if (this.esProfesional && shortname) {
      // Los profesionales solo ven sus propios pacientes
      this.pacienteService.obtenerPacientesPorProfesional(shortname).subscribe({
        next: (pacientes: any[]) => {
          this.datosOriginales = [...pacientes];  // Guarda copia de los datos originales
          this.pacientes.data = pacientes;        // Actualiza la tabla
          this.isLoading = false;                 // Desactiva el indicador de carga
        },
        error: (error: any) => {
          console.error('Error al cargar pacientes del profesional', error);
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;  // Si no hay rol válido, desactiva el indicador de carga
    }
  }

  /**
   * Ordena la tabla de pacientes por una columna específica
   * Permite ordenamiento ascendente y descendente con lógica inteligente
   * 
   * @param columna - Nombre de la columna por la cual ordenar
   */
  ordenarPor(columna: string): void {
    console.log('Ordenando por:', columna);
    
    // Si es la misma columna, cambia la dirección del ordenamiento
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      // Nueva columna, empieza con ordenamiento ascendente
      this.columnaOrden = columna;
      this.direccionOrden = 'asc';
    }

    // Ordena los datos según la columna seleccionada
    const datosOrdenados = [...this.datosOriginales].sort((a, b) => {
      let valorA: any;
      let valorB: any;

      // Determina qué valores comparar según la columna
      switch (columna) {
        case 'dni':
          valorA = a.DNI;
          valorB = b.DNI;
          break;
        case 'nombre':
          valorA = a.Nombre?.toLowerCase();  // Convierte a minúsculas para comparación
          valorB = b.Nombre?.toLowerCase();
          break;
        case 'apellido':
          valorA = a.Apellido?.toLowerCase();
          valorB = b.Apellido?.toLowerCase();
          break;
        case 'edad':
          valorA = this.calcularEdad(a.FechaNacimiento);  // Calcula la edad
          valorB = this.calcularEdad(b.FechaNacimiento);
          break;
        default:
          valorA = a[columna];
          valorB = b[columna];
      }

      // Compara los valores y retorna el resultado según la dirección del ordenamiento
      if (valorA < valorB) {
        return this.direccionOrden === 'asc' ? -1 : 1;
      }
      if (valorA > valorB) {
        return this.direccionOrden === 'asc' ? 1 : -1;
      }
      return 0;  // Los valores son iguales
    });

    this.pacientes.data = datosOrdenados;  // Actualiza la tabla con los datos ordenados
    console.log('Datos ordenados:', this.pacientes.data);
  }

  /**
   * Navega a la vista de detalle de un paciente específico
   * Utiliza el DNI como identificador único para la navegación
   * 
   * @param paciente - Objeto con los datos del paciente
   */
  verDetallePaciente(paciente: any): void {
    this.router.navigate(['/pacientes', paciente.DNI]);  // Navega usando el DNI como parámetro
  }

  /**
   * Navega al formulario para crear un nuevo paciente
   * Redirige al usuario al formulario de registro de pacientes
   */
  nuevoPaciente(): void {
    this.router.navigate(['/pacientes/nuevo']);
  }

  /**
   * Navega a la agenda de un paciente específico
   * Permite ver y gestionar los turnos del paciente seleccionado
   * 
   * @param paciente - Objeto con los datos del paciente
   */
  agendaPaciente(paciente: any): void {
    this.router.navigate(['/pacientes/agenda', paciente.DNI]);
  }

  /**
   * Navega al seguimiento de un paciente específico
   * Accede a la información de seguimiento médico del paciente
   * 
   * @param paciente - Objeto con los datos del paciente
   */
  seguimientoPaciente(paciente: any): void {
    this.router.navigate(['/pacientes/seguimiento', paciente.DNI]);
  }

  /**
   * Navega al seguimiento evolutivo de un paciente
   * Previene la propagación del evento para evitar conflictos con otros clics
   * 
   * @param paciente - Objeto con los datos del paciente
   * @param event - Evento del clic
   */
  irASeguimientoEvolutivo(paciente: any, event: Event) {
    event.stopPropagation();  // Previene que el evento se propague al elemento padre
    this.router.navigate(['/pacientes/seguimiento-evolutivo'], { 
      queryParams: { pacienteId: paciente.ID || paciente.id } 
    });
  }

  /**
   * Navega a las notas de voz de un paciente
   * Previene la propagación del evento para evitar conflictos con otros clics
   * 
   * @param paciente - Objeto con los datos del paciente
   * @param event - Evento del clic
   */
  irANotasVoz(paciente: any, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/pacientes/notasvoz'], { 
      queryParams: { pacienteId: paciente.ID || paciente.id } 
    });
  }

  /**
   * Navega a los turnos filtrando por un paciente específico
   * Previene la propagación del evento y construye el nombre completo
   * 
   * @param paciente - Objeto con los datos del paciente
   * @param event - Evento del clic
   */
  irATurnos(paciente: any, event: Event) {
    event.stopPropagation();
    const nombreCompleto = `${paciente.Nombre} ${paciente.Apellido}`;  // Construye el nombre completo
    this.router.navigate(['/turnos'], { 
      queryParams: { paciente: nombreCompleto } 
    });
  }

  /**
   * Abre el diálogo para adjuntar documentación a un paciente
   * Previene la propagación del evento y maneja diferentes formatos de ID
   * 
   * @param paciente - Objeto con los datos del paciente
   * @param event - Evento del clic
   */
  adjuntarDocumentacion(paciente: any, event: Event) {
    event.stopPropagation();
    console.log('Datos del paciente:', paciente);
    
    // Intenta obtener el ID del paciente de diferentes formas posibles
    const idPaciente = paciente.ID || paciente.id || paciente.Id || paciente.ID_Paciente || paciente.id_paciente;
    console.log('ID del paciente encontrado:', idPaciente);
    
    if (!idPaciente) {
      console.error('No se pudo encontrar el ID del paciente');
      alert('Error: No se pudo identificar el paciente');
      return;
    }
    
    // Abre el diálogo de adjuntar archivo
    const dialogRef = this.dialog.open(AdjuntarArchivoDialogComponent, {
      data: { idPaciente: idPaciente },  // Pasa el ID del paciente al diálogo
      width: '520px'
    });
    
    // Maneja el cierre del diálogo
    dialogRef.afterClosed().subscribe(result => {
      // El diálogo maneja su propia lógica de actualización
    });
  }

  /**
   * Aplica un filtro de búsqueda a la tabla de pacientes
   * Filtra por cualquier campo de texto y resetea la paginación
   * 
   * @param event - Evento del input de búsqueda
   */
  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;  // Obtiene el valor del input
    this.pacientes.filter = filterValue.trim().toLowerCase();      // Aplica el filtro

    // Resetea la paginación a la primera página
    if (this.pacientes.paginator) {
      this.pacientes.paginator.firstPage();
    }
  }

  /**
   * Calcula la edad de una persona basada en su fecha de nacimiento
   * Implementa lógica precisa considerando mes y día de nacimiento
   * 
   * @param fechaNacimiento - Fecha de nacimiento en formato string
   * @returns Edad calculada en años
   */
  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;  // Si no hay fecha, retorna 0
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    
    // Ajusta la edad si aún no ha cumplido años este año
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }

  /**
   * Getter que verifica si la ruta actual es de turnos
   * Útil para mostrar/ocultar elementos según la sección actual
   * 
   * @returns true si la ruta actual es de turnos
   */
  get esRutaTurnos(): boolean {
    return this.router.url.startsWith('/turnos');
  }

  /**
   * Getter que verifica si la ruta actual es de pacientes
   * Útil para mostrar/ocultar elementos según la sección actual
   * 
   * @returns true si la ruta actual es de pacientes
   */
  get esRutaPacientes(): boolean {
    return this.router.url.startsWith('/pacientes');
  }
} 