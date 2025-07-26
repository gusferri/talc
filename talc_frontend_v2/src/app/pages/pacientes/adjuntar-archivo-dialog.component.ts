/**
 * Componente de diálogo para gestión de archivos adjuntos de pacientes
 * 
 * Este diálogo permite a los profesionales gestionar la documentación
 * asociada a un paciente específico, incluyendo:
 * - Visualización de archivos existentes
 * - Subida de nuevos archivos
 * - Descarga de documentos
 * - Eliminación de archivos
 * - Visualización en línea de documentos
 * 
 * Funcionalidades principales:
 * - Gestión completa de archivos adjuntos
 * - Interfaz intuitiva para subida de archivos
 * - Visualización de diferentes tipos de archivo
 * - Validación de archivos y descripciones
 * - Estados de carga y feedback visual
 * - Seguridad en la gestión de documentos médicos
 */

// Importaciones de Angular Core
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

// Importaciones de Angular Forms
import { FormsModule } from '@angular/forms';

// Importaciones de Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

// Importaciones de servicios
import { AdjuntosService, AdjuntoBackend } from '../../services/adjuntos.service';

/**
 * Diálogo principal para gestión de archivos adjuntos
 * Permite visualizar, subir, descargar y eliminar archivos de pacientes
 */
@Component({
  selector: 'app-adjuntar-archivo-dialog',
  standalone: true,
  template: `
    <!-- Contenedor principal del diálogo -->
    <div class="dialog-wrapper">
      <!-- Título del diálogo -->
      <h2 mat-dialog-title class="dialog-title">Documentación del Paciente</h2>
      
      <!-- Contenido principal del diálogo -->
      <div mat-dialog-content class="dialog-content">
        <!-- Lista de archivos adjuntos existentes -->
        <div *ngIf="adjuntos.length > 0" class="adjuntos-list">
          <h3 class="adjuntos-title">Archivos adjuntos</h3>
          <ul>
            <li *ngFor="let adj of adjuntos">
              <!-- Icono de archivo -->
              <mat-icon>attach_file</mat-icon>
              <!-- Nombre del archivo -->
              <span>{{ adj.Nombre }}</span>
              <!-- Botón para visualizar archivo -->
              <button mat-icon-button (click)="verAdjunto(adj)" matTooltip="Ver archivo">
                <mat-icon>visibility</mat-icon>
              </button>
              <!-- Botón para descargar archivo -->
              <button mat-icon-button (click)="descargarAdjunto(adj)" matTooltip="Descargar">
                <mat-icon>download</mat-icon>
              </button>
              <!-- Botón para eliminar archivo -->
              <button mat-icon-button (click)="eliminarAdjunto(adj)" matTooltip="Eliminar" color="warn">
                <mat-icon>delete</mat-icon>
              </button>
            </li>
          </ul>
        </div>
        
        <!-- Sección para adjuntar nuevo archivo -->
        <div class="nuevo-adjunto">
          <h3 class="nuevo-title">Adjuntar nuevo archivo</h3>
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
            <!-- Botón para seleccionar archivo -->
            <button mat-stroked-button color="primary" (click)="fileInput.click()">
              Seleccionar archivo
            </button>
            <!-- Input de archivo oculto -->
            <input #fileInput type="file" style="display: none" (change)="onFileSelected($event)" />
            <!-- Campo de descripción del archivo -->
            <mat-form-field appearance="fill" style="flex: 1; margin-top: 0;">
              <mat-label>Descripción del archivo</mat-label>
              <input matInput [(ngModel)]="descripcionArchivo" placeholder="Ej: DNI, certificado, etc.">
            </mat-form-field>
          </div>
          <!-- Información del archivo seleccionado -->
          <div *ngIf="file" style="margin-top: 10px; font-size: 14px;">
            <p><strong>Archivo seleccionado:</strong> {{ file.name }}</p>
            <p><strong>Tamaño:</strong> {{ file.size / 1024 | number:'1.0-2' }} KB</p>
          </div>
        </div>
      </div>
      
      <!-- Acciones del diálogo -->
      <div mat-dialog-actions align="end" class="dialog-actions">
        <!-- Botón para cancelar -->
        <button mat-stroked-button (click)="onCancelar()">Cancelar</button>
        <!-- Botón para guardar (deshabilitado si no hay archivo o descripción) -->
        <button mat-raised-button color="primary" (click)="onGuardar()" [disabled]="!file || !descripcionArchivo.trim() || cargando">
          <mat-icon *ngIf="cargando">hourglass_empty</mat-icon>
          {{ cargando ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>
  `,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule],
  styles: [
    /* Contenedor principal del diálogo */
    `.dialog-wrapper { 
      max-width: 520px; 
      min-width: 350px; 
      padding: 28px 24px 18px 24px; 
      box-sizing: border-box; 
    }
    
    /* Título del diálogo */
    .dialog-title { 
      font-size: 1.3rem; 
      font-weight: 600; 
      margin-bottom: 0.5rem; 
      color: #333; 
    }
    
    /* Contenido principal */
    .dialog-content { 
      margin-bottom: 18px; 
    }
    
    /* Lista de archivos adjuntos */
    .adjuntos-list { 
      margin-bottom: 18px; 
    }
    
    /* Título de la sección de adjuntos */
    .adjuntos-title { 
      font-size: 1.1rem; 
      margin-bottom: 8px; 
    }
    
    /* Lista sin estilos por defecto */
    ul { 
      list-style: none; 
      padding: 0; 
      margin: 0; 
    }
    
    /* Elementos de la lista */
    li { 
      display: flex; 
      align-items: center; 
      gap: 8px; 
      margin-bottom: 6px; 
    }
    
    /* Título de la sección de nuevo adjunto */
    .nuevo-title { 
      font-size: 1.1rem; 
      margin-bottom: 8px; 
    }
    
    /* Contenedor de acciones */
    .dialog-actions { 
      margin-top: 18px; 
      display: flex; 
      gap: 12px; 
      justify-content: flex-end; 
      padding-bottom: 4px; 
    }
    
    /* Estilos para botones */
    button[mat-stroked-button], button[mat-raised-button] { 
      min-width: 110px; 
    }
    `]
})
export class AdjuntarArchivoDialogComponent implements OnInit {
  /** Lista de archivos adjuntos del paciente */
  adjuntos: AdjuntoBackend[] = [];

  /** Archivo seleccionado para subir */
  file: File | null = null;

  /** Descripción del archivo a subir */
  descripcionArchivo: string = '';

  /** Estado de carga durante la subida */
  cargando: boolean = false;

  /**
   * Constructor del componente
   * Inicializa el diálogo con los servicios necesarios
   */
  constructor(
    public dialogRef: MatDialogRef<AdjuntarArchivoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idPaciente: number },
    private dialog: MatDialog,
    private adjuntosService: AdjuntosService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Hook del ciclo de vida - se ejecuta al inicializar el componente
   * Carga los archivos adjuntos existentes del paciente
   */
  ngOnInit() {
    console.log('AdjuntarArchivoDialog - Datos recibidos:', this.data);
    console.log('ID del paciente:', this.data.idPaciente);
    this.cargarAdjuntos();
  }

  /**
   * Carga los archivos adjuntos del paciente desde el servidor
   * Actualiza la lista de archivos disponibles
   */
  cargarAdjuntos() {
    console.log('Cargando adjuntos para paciente ID:', this.data.idPaciente);
    this.adjuntosService.obtenerAdjuntos(this.data.idPaciente).subscribe({
      next: (adjuntos: any[]) => {
        // Mapear Titulo a Nombre para compatibilidad con la interfaz AdjuntoBackend
        this.adjuntos = adjuntos.map(adj => ({
          ...adj,
          Nombre: adj.Titulo // Usar el nombre descriptivo
        }));
        console.log('Adjuntos cargados:', this.adjuntos);
      },
      error: (error: any) => {
        console.error('Error al cargar adjuntos:', error);
        this.snackBar.open('Error al cargar los adjuntos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Maneja la selección de un archivo del input file
   * Actualiza la propiedad file con el archivo seleccionado
   *
   * @param event - Evento de cambio del input file
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
    }
  }

  /**
   * Cierra el diálogo sin realizar cambios
   */
  onCancelar(): void {
    this.dialogRef.close();
  }

  /**
   * Sube el archivo seleccionado al servidor
   * Incluye validaciones y manejo de estados de carga
   */
  onGuardar(): void {
    // Validar que existe un archivo y descripción
    if (!this.file || !this.descripcionArchivo.trim()) return;

    // Activar estado de carga
    this.cargando = true;
    const username = localStorage.getItem('username') || '';
    
    // Preparar FormData con los datos del archivo
    const formData = new FormData();
    formData.append('archivo', this.file);
    formData.append('titulo', this.descripcionArchivo);
    formData.append('id_paciente', this.data.idPaciente.toString());
    formData.append('username', username);

    // Llamar al servicio para subir el archivo
    this.adjuntosService.subirAdjunto(formData).subscribe({
      next: (response) => {
        // Éxito: mostrar mensaje y recargar lista
        this.snackBar.open('Archivo subido correctamente', 'Cerrar', { duration: 3000 });
        this.cargarAdjuntos(); // Recargar la lista
        this.file = null;
        this.descripcionArchivo = '';
        this.cargando = false;
      },
      error: (error) => {
        // Error: mostrar mensaje de error
        console.error('Error al subir archivo:', error);
        this.snackBar.open('Error al subir el archivo', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      }
    });
  }

  /**
   * Descarga un archivo adjunto del servidor
   * Crea un enlace temporal para la descarga
   *
   * @param adj - Archivo adjunto a descargar
   */
  descargarAdjunto(adj: AdjuntoBackend) {
    this.adjuntosService.descargarAdjunto(adj.ID).subscribe({
      next: (blob) => {
        // Crear URL temporal para la descarga
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = adj.Nombre;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.snackBar.open('Descarga iniciada', 'Cerrar', { duration: 2000 });
      },
      error: (error) => {
        console.error('Error al descargar:', error);
        this.snackBar.open('Error al descargar el archivo', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Visualiza un archivo adjunto en un diálogo
   * Abre el visor de archivos para diferentes tipos de documento
   *
   * @param adj - Archivo adjunto a visualizar
   */
  verAdjunto(adj: AdjuntoBackend) {
    this.adjuntosService.visualizarAdjunto(adj.ID).subscribe({
      next: (blob) => {
        // Crear URL temporal para la visualización
        const url = URL.createObjectURL(blob);
        // Abrir diálogo visor con los datos del archivo
        this.dialog.open(VisorAdjuntoDialogComponent, {
          data: { ...adj, url },
          width: '600px'
        });
      },
      error: (error) => {
        console.error('Error al visualizar:', error);
        this.snackBar.open('Error al visualizar el archivo', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Elimina un archivo adjunto del servidor
   * Solicita confirmación antes de proceder
   *
   * @param adj - Archivo adjunto a eliminar
   */
  eliminarAdjunto(adj: AdjuntoBackend) {
    // Solicitar confirmación antes de eliminar
    if (confirm(`¿Estás seguro de que quieres eliminar "${adj.Nombre}"?`)) {
      this.adjuntosService.eliminarAdjunto(adj.ID).subscribe({
        next: () => {
          // Éxito: mostrar mensaje y recargar lista
          this.snackBar.open('Archivo eliminado correctamente', 'Cerrar', { duration: 3000 });
          this.cargarAdjuntos(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          this.snackBar.open('Error al eliminar el archivo', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}

/**
 * Componente de diálogo para visualizar archivos adjuntos
 * 
 * Este diálogo permite visualizar diferentes tipos de archivos
 * directamente en el navegador, incluyendo:
 * - Imágenes (JPG, PNG, GIF)
 * - Documentos PDF
 * - Mensaje informativo para otros tipos
 * 
 * Funcionalidades:
 * - Visualización en línea de documentos
 * - Soporte para múltiples formatos
 * - Interfaz limpia y centrada
 * - Manejo de archivos no visualizables
 */
@Component({
  selector: 'app-visor-adjunto-dialog',
  standalone: true,
  template: `
    <!-- Contenedor principal del visor -->
    <div style="padding: 24px; min-width: 350px; max-width: 600px;">
      <!-- Título del archivo -->
      <h2 mat-dialog-title style="font-size: 1.2rem; font-weight: 600; margin-bottom: 18px;">{{ data.titulo }}</h2>
      
      <!-- Contenido del archivo según su tipo -->
      <ng-container [ngSwitch]="tipoAdjunto">
        <!-- Visualización de imágenes -->
        <img *ngSwitchCase="'img'" 
             [src]="data.url" 
             alt="Imagen adjunta" 
             style="max-width: 100%; max-height: 400px; display: block; margin: 0 auto;" />
        
        <!-- Visualización de PDFs -->
        <iframe *ngSwitchCase="'pdf'" 
                [src]="data.url" 
                style="width: 100%; height: 400px; border: none;"></iframe>
        
        <!-- Mensaje para archivos no visualizables -->
        <div *ngSwitchDefault style="text-align: center; color: #888;">
          No se puede visualizar este tipo de archivo.<br>
          Puedes descargarlo para abrirlo en tu dispositivo.
        </div>
      </ng-container>
      
      <!-- Botón para cerrar el visor -->
      <div style="margin-top: 18px; text-align: right;">
        <button mat-button (click)="dialogRef.close()">Cerrar</button>
      </div>
    </div>
  `,
  imports: [CommonModule, MatButtonModule],
})
export class VisorAdjuntoDialogComponent {
  /** Tipo de archivo detectado para visualización */
  tipoAdjunto: 'img' | 'pdf' | 'otro' = 'otro';

  /**
   * Constructor del componente visor
   * Detecta el tipo de archivo basado en la extensión
   */
  constructor(
    public dialogRef: MatDialogRef<VisorAdjuntoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Lógica simple para detectar tipo por extensión
    if (data.titulo?.toLowerCase().endsWith('.pdf')) {
      this.tipoAdjunto = 'pdf';
    } else if (data.titulo?.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
      this.tipoAdjunto = 'img';
    } else {
      this.tipoAdjunto = 'otro';
    }
  }
} 