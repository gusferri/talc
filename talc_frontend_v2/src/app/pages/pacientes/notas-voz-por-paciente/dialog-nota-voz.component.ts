/**
 * Componente de diálogo para visualizar y editar transcripciones de notas de voz
 * 
 * Este diálogo permite a los profesionales ver y modificar las transcripciones
 * de las notas de voz asociadas a los turnos de los pacientes.
 * 
 * Funcionalidades principales:
 * - Visualización de información del paciente y turno
 * - Edición de transcripciones existentes
 * - Guardado de cambios en tiempo real
 * - Estados de carga y guardado
 * - Validación de datos
 */

// Importaciones de Angular Core
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

// Importaciones de Angular Forms
import { FormsModule } from '@angular/forms';

// Importaciones de Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

// Importaciones de servicios
import { NotasVozService } from '../../../services/notas-voz.service';

/**
 * Diálogo para visualizar y editar transcripciones de notas de voz
 * Permite a los profesionales modificar las transcripciones existentes
 */
@Component({
  selector: 'app-dialog-nota-voz',
  standalone: true,
  template: `
    <!-- Contenedor principal del diálogo -->
    <div class="dialog-wrapper">
      <!-- Título del diálogo -->
      <h2 mat-dialog-title class="dialog-title">Transcripción de la nota de voz</h2>
      
      <!-- Contenido principal del diálogo -->
      <div mat-dialog-content class="dialog-content">
        <!-- Información del paciente y turno -->
        <div class="info">
          <span class="paciente"><mat-icon>person</mat-icon> {{ data.paciente?.Apellido }}, {{ data.paciente?.Nombre }}</span>
          <span class="fecha"><mat-icon>event</mat-icon> {{ (data.turno.Fecha || data.turno.fecha) | date:'dd/MM/yyyy' }}</span>
          <span class="hora"><mat-icon>schedule</mat-icon> {{ data.turno.Hora || data.turno.hora }}</span>
        </div>
        
        <!-- Spinner de carga mientras se obtiene la transcripción -->
        <div *ngIf="loading" class="loading-spinner"><mat-spinner diameter="40"></mat-spinner></div>
        
        <!-- Campo de texto para editar la transcripción -->
        <mat-form-field appearance="outline" class="textarea-transcripcion" *ngIf="!loading">
          <mat-label>Transcripción</mat-label>
          <textarea matInput rows="8" [(ngModel)]="transcripcion" cdkTextareaAutosize></textarea>
        </mat-form-field>
      </div>
      
      <!-- Acciones del diálogo -->
      <div mat-dialog-actions align="end" class="dialog-actions">
        <!-- Botón para guardar cambios -->
        <button mat-stroked-button color="primary" (click)="guardar()" [disabled]="saving || loading">
          <mat-icon>save</mat-icon> Guardar
        </button>
        <!-- Botón para cerrar el diálogo -->
        <button mat-button (click)="cerrar()">
          <mat-icon>close</mat-icon> Cerrar
        </button>
      </div>
    </div>
  `,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  styles: [`
    /* Contenedor principal del diálogo */
    .dialog-wrapper {
      max-width: 600px;              /* Ancho máximo para legibilidad */
      min-width: 400px;              /* Ancho mínimo */
      padding: 32px 28px 20px 28px;  /* Espaciado interno */
      box-sizing: border-box;        /* Modelo de caja */
    }
    
    /* Título del diálogo */
    .dialog-title {
      font-size: 1.5rem;             /* Tamaño de fuente grande */
      font-weight: 600;              /* Peso de fuente semi-bold */
      margin-bottom: 0.5rem;         /* Espaciado inferior */
      color: #333;                   /* Color de texto oscuro */
    }
    
    /* Contenido principal */
    .dialog-content {
      padding: 0 2px 0 2px;          /* Espaciado horizontal mínimo */
      margin-bottom: 18px;           /* Espaciado inferior */
    }
    
    /* Sección de información del paciente y turno */
    .info {
      display: flex;                 /* Layout flexbox */
      flex-wrap: wrap;               /* Envolver en pantallas pequeñas */
      gap: 18px;                     /* Espaciado entre elementos */
      margin-bottom: 18px;           /* Espaciado inferior */
      font-size: 1rem;               /* Tamaño de fuente */
      color: #555;                   /* Color de texto gris */
      align-items: center;           /* Centrado vertical */
    }
    
    /* Iconos de información */
    .info mat-icon {
      font-size: 18px;               /* Tamaño del icono */
      vertical-align: middle;        /* Alineación vertical */
      margin-right: 4px;             /* Espaciado derecho */
      color: #aa262b;                /* Color corporativo TALC */
    }
    
    /* Campo de texto para transcripción */
    .textarea-transcripcion {
      width: 100%;                   /* Ancho completo */
      margin-bottom: 8px;            /* Espaciado inferior */
      background: #faf9f6;           /* Fondo claro */
      border-radius: 10px;           /* Bordes redondeados */
    }
    
    /* Estilos específicos del textarea */
    textarea[matInput] {
      background: #faf9f6;           /* Fondo claro */
      border-radius: 10px;           /* Bordes redondeados */
      font-size: 1rem;               /* Tamaño de fuente */
      padding: 12px;                 /* Espaciado interno */
      min-height: 120px;             /* Altura mínima */
      max-height: 300px;             /* Altura máxima */
      resize: vertical;              /* Solo redimensionar verticalmente */
    }
    
    /* Contenedor de acciones */
    .dialog-actions {
      margin-top: 18px;              /* Espaciado superior */
      display: flex;                 /* Layout flexbox */
      gap: 12px;                     /* Espaciado entre botones */
      justify-content: flex-end;     /* Alineación a la derecha */
      padding-bottom: 4px;           /* Espaciado inferior */
    }
    
    /* Estilos para botón de guardar */
    button[mat-stroked-button] {
      font-weight: 500;              /* Peso de fuente medium */
      min-width: 120px;              /* Ancho mínimo */
    }
    
    /* Estilos para botón de cerrar */
    button[mat-button] {
      min-width: 90px;               /* Ancho mínimo */
    }
    
    /* Contenedor del spinner de carga */
    .loading-spinner {
      display: flex;                 /* Layout flexbox */
      justify-content: center;       /* Centrado horizontal */
      align-items: center;           /* Centrado vertical */
      margin-bottom: 18px;           /* Espaciado inferior */
    }
  `]
})
export class DialogNotaVozComponent {
  /** Texto de la transcripción actual */
  transcripcion: string = '';
  
  /** Estado de carga de la transcripción */
  loading: boolean = false;
  
  /** Estado de guardado de cambios */
  saving: boolean = false;
  
  /** ID de la nota de voz asociada */
  idNotaVoz: number | null = null;

  /**
   * Constructor del componente
   * Inicializa el diálogo con los datos recibidos
   */
  constructor(
    public dialogRef: MatDialogRef<DialogNotaVozComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private notasVozService: NotasVozService,
    private snackBar: MatSnackBar
  ) {
    // Inicializar transcripción con datos recibidos
    this.transcripcion = data.transcripcion || '';
    this.loading = data.loading || false;
    
    // Obtener ID de la nota de voz del turno
    this.idNotaVoz = data.turno.ID_NotaVoz || data.turno.id_nota_voz || null;
  }

  /**
   * Guarda los cambios realizados en la transcripción
   * Envía la transcripción actualizada al servidor
   */
  guardar() {
    // Validar que existe un ID de nota de voz
    if (!this.idNotaVoz) {
      this.snackBar.open('No se encontró el ID de la nota de voz.', 'Cerrar', { duration: 3000 });
      return;
    }
    
    // Activar estado de guardado
    this.saving = true;
    
    // Llamar al servicio para actualizar la transcripción
    this.notasVozService.actualizarNotaVoz(this.idNotaVoz, this.transcripcion).subscribe({
      next: () => {
        // Éxito: desactivar estado de guardado y mostrar mensaje
        this.saving = false;
        this.snackBar.open('Transcripción guardada correctamente.', 'Cerrar', { duration: 2500 });
        
        // Cerrar diálogo con la transcripción actualizada
        this.dialogRef.close({ transcripcion: this.transcripcion });
      },
      error: () => {
        // Error: desactivar estado de guardado y mostrar mensaje de error
        this.saving = false;
        this.snackBar.open('Error al guardar la transcripción.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  /**
   * Cierra el diálogo sin guardar cambios
   */
  cerrar() {
    this.dialogRef.close();
  }
} 