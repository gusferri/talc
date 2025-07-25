/**
 * Componente de diálogo para visualizar y editar informes evolutivos
 * 
 * Este diálogo permite a los profesionales ver y modificar los informes
 * evolutivos de los pacientes, incluyendo información del paciente,
 * fecha de generación, profesional responsable y tipo de informe.
 * 
 * Funcionalidades principales:
 * - Visualización de información completa del informe
 * - Edición del resumen del informe
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
import { MatSnackBar } from '@angular/material/snack-bar';

// Importaciones de servicios
import { InformesService } from '../../../services/informes.service';

/**
 * Diálogo para visualizar y editar informes evolutivos
 * Permite a los profesionales modificar los resúmenes de los informes
 */
@Component({
  selector: 'app-dialog-informe-evolutivo',
  standalone: true,
  template: `
    <!-- Contenedor principal del diálogo -->
    <div class="dialog-wrapper">
      <!-- Título del diálogo -->
      <h2 mat-dialog-title class="dialog-title">Informe Evolutivo</h2>
      
      <!-- Contenido principal del diálogo -->
      <div mat-dialog-content class="dialog-content">
        <!-- Información del informe y paciente -->
        <div class="info">
          <span class="paciente"><strong>Paciente:</strong> {{ data.paciente?.Apellido }}, {{ data.paciente?.Nombre }}</span>
          <span class="fecha"><strong>Fecha:</strong> {{ data.informe?.FechaGenerado | date:'dd/MM/yyyy' }}</span>
          <span class="profesional"><strong>Profesional:</strong> {{ data.informe?.Nombre }} {{ data.informe?.Apellido }}</span>
          <span class="tipo"><strong>Tipo de Informe:</strong> {{ data.informe?.NombreTipoInforme }}</span>
        </div>
        
        <!-- Campo de texto para editar el resumen del informe -->
        <mat-form-field appearance="outline" class="textarea-transcripcion">
          <mat-label>Resumen</mat-label>
          <textarea matInput rows="10" [(ngModel)]="data.informe.Resumen"></textarea>
        </mat-form-field>
      </div>
      
      <!-- Acciones del diálogo -->
      <div mat-dialog-actions align="end" class="dialog-actions">
        <!-- Botón para guardar cambios -->
        <button mat-stroked-button color="primary" (click)="onSave()" [disabled]="saving">
          Guardar
        </button>
        <!-- Botón para cerrar el diálogo -->
        <button mat-button (click)="onClose()" [disabled]="saving">
          Cerrar
        </button>
      </div>
    </div>
  `,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
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
    
    /* Sección de información del informe */
    .info {
      display: flex;                 /* Layout flexbox */
      flex-wrap: wrap;               /* Envolver en pantallas pequeñas */
      gap: 18px;                     /* Espaciado entre elementos */
      margin-bottom: 18px;           /* Espaciado inferior */
      font-size: 1rem;               /* Tamaño de fuente */
      color: #555;                   /* Color de texto gris */
      align-items: center;           /* Centrado vertical */
    }
    
    /* Campo de texto para resumen del informe */
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
  `]
})
export class DialogInformeEvolutivoComponent {
  /** Estado de guardado del informe */
  saving = false;

  /**
   * Constructor del componente
   * Inicializa el diálogo con los datos recibidos
   */
  constructor(
    public dialogRef: MatDialogRef<DialogInformeEvolutivoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private informesService: InformesService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Guarda los cambios realizados en el informe
   * Envía el resumen actualizado al servidor
   */
  onSave() {
    const id = this.data.informe?.ID;
    const resumen = this.data.informe?.Resumen;
    
    // Validar que existen los datos necesarios
    if (!id || !resumen) {
      this.snackBar.open('Faltan datos para guardar el informe.', 'Cerrar', { duration: 3000 });
      return;
    }
    
    // Activar estado de guardado
    this.saving = true;
    
    // Llamar al servicio para actualizar el informe
    this.informesService.actualizarInforme(id, resumen).subscribe({
      next: () => {
        // Éxito: desactivar estado de guardado y mostrar mensaje
        this.saving = false;
        this.snackBar.open('Informe actualizado correctamente.', 'Cerrar', { duration: 2500 });
        
        // Cerrar diálogo con el resumen actualizado
        this.dialogRef.close({ resumen });
      },
      error: () => {
        // Error: desactivar estado de guardado y mostrar mensaje de error
        this.saving = false;
        this.snackBar.open('Error al guardar el informe.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  /**
   * Cierra el diálogo sin guardar cambios
   */
  onClose() {
    this.dialogRef.close();
  }
} 