/**
 * Componente de diálogo para grabar nuevas notas de voz
 * 
 * Este diálogo permite a los profesionales grabar notas de voz
 * directamente desde el navegador usando la API MediaRecorder.
 * 
 * Funcionalidades principales:
 * - Grabación de audio en tiempo real
 * - Visualización de información del paciente y turno
 * - Control de grabación (iniciar/parar)
 * - Reproducción del audio grabado
 * - Subida del archivo al servidor
 * - Estados de grabación y guardado
 */

// Importaciones de Angular Core
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

// Importaciones de Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

// Importaciones de servicios
import { NotasVozService } from '../../../services/notas-voz.service';

/**
 * Diálogo para grabar nuevas notas de voz
 * Permite a los profesionales grabar audio directamente desde el navegador
 */
@Component({
  selector: 'app-dialog-grabar-nota-voz',
  standalone: true,
  template: `
    <!-- Contenedor principal del diálogo -->
    <div class="dialog-wrapper">
      <!-- Título del diálogo -->
      <h2 mat-dialog-title class="dialog-title">Grabar nueva nota de voz</h2>
      
      <!-- Información del paciente y turno -->
      <div class="info">
        <span class="paciente"><mat-icon>person</mat-icon> {{ data.paciente?.Apellido }}, {{ data.paciente?.Nombre }}</span>
        <span class="fecha"><mat-icon>event</mat-icon> {{ (data.turno.Fecha || data.turno.fecha) | date:'dd/MM/yyyy' }}</span>
        <span class="hora"><mat-icon>schedule</mat-icon> {{ data.turno.Hora || data.turno.hora }}</span>
      </div>
      
      <!-- Sección de grabación -->
      <div class="recorder-section">
        <!-- Botón principal de grabación -->
        <button mat-fab color="warn" (click)="toggleRecording()">
          <mat-icon *ngIf="!isRecording">mic</mat-icon>
          <mat-icon *ngIf="isRecording">stop</mat-icon>
        </button>
        
        <!-- Indicador de grabación con tiempo transcurrido -->
        <div class="rec-indicator" *ngIf="isRecording">
          <span class="dot"></span> Grabando... {{ elapsed | date:'mm:ss':'UTC' }}
        </div>
        
        <!-- Reproductor de audio para escuchar la grabación -->
        <audio *ngIf="audioUrl" [src]="audioUrl" controls style="margin-top: 16px;"></audio>
      </div>
      
      <!-- Acciones del diálogo -->
      <div class="dialog-actions">
        <!-- Botón para guardar la nota de voz -->
        <button mat-stroked-button color="primary" (click)="guardar()" [disabled]="!audioBlob || saving">
          <mat-icon>save</mat-icon> Guardar
        </button>
        <!-- Botón para cancelar -->
        <button mat-button (click)="cerrar()" [disabled]="saving">
          <mat-icon>close</mat-icon> Cancelar
        </button>
      </div>
    </div>
  `,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  styles: [`
    /* Contenedor principal del diálogo */
    .dialog-wrapper {
      max-width: 500px;              /* Ancho máximo para usabilidad */
      min-width: 350px;              /* Ancho mínimo */
      padding: 32px 24px 20px 24px;  /* Espaciado interno */
      box-sizing: border-box;        /* Modelo de caja */
    }
    
    /* Título del diálogo */
    .dialog-title {
      font-size: 1.4rem;             /* Tamaño de fuente */
      font-weight: 600;              /* Peso de fuente semi-bold */
      margin-bottom: 0.5rem;         /* Espaciado inferior */
      color: #333;                   /* Color de texto oscuro */
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
    
    /* Sección de grabación */
    .recorder-section {
      display: flex;                 /* Layout flexbox */
      flex-direction: column;        /* Dirección vertical */
      align-items: center;           /* Centrado horizontal */
      margin-bottom: 18px;           /* Espaciado inferior */
    }
    
    /* Indicador de grabación */
    .rec-indicator {
      margin-top: 12px;              /* Espaciado superior */
      color: #c62828;                /* Color rojo para indicar grabación */
      font-weight: 500;              /* Peso de fuente medium */
      display: flex;                 /* Layout flexbox */
      align-items: center;           /* Centrado vertical */
      gap: 8px;                      /* Espaciado entre elementos */
    }
    
    /* Punto animado de grabación */
    .dot {
      width: 12px;                   /* Ancho del punto */
      height: 12px;                  /* Alto del punto */
      background: #c62828;           /* Color rojo */
      border-radius: 50%;            /* Forma circular */
      display: inline-block;         /* Display inline */
      animation: blink 1s infinite;  /* Animación de parpadeo */
    }
    
    /* Animación de parpadeo para el indicador */
    @keyframes blink {
      0%, 100% { opacity: 1; }       /* Visible */
      50% { opacity: 0.2; }          /* Semi-transparente */
    }
    
    /* Contenedor de acciones */
    .dialog-actions {
      margin-top: 18px;              /* Espaciado superior */
      display: flex;                 /* Layout flexbox */
      gap: 12px;                     /* Espaciado entre botones */
      justify-content: flex-end;     /* Alineación a la derecha */
    }
    
    /* Estilos para botón de guardar */
    button[mat-stroked-button] {
      font-weight: 500;              /* Peso de fuente medium */
      min-width: 120px;              /* Ancho mínimo */
    }
    
    /* Estilos para botón de cancelar */
    button[mat-button] {
      min-width: 90px;               /* Ancho mínimo */
    }
  `]
})
export class DialogGrabarNotaVozComponent {
  /** Estado de grabación actual */
  isRecording = false;
  
  /** Fragmentos de audio capturados */
  audioChunks: Blob[] = [];
  
  /** Blob final del audio grabado */
  audioBlob: Blob | null = null;
  
  /** URL del audio para reproducción */
  audioUrl: string | null = null;
  
  /** Instancia del MediaRecorder */
  mediaRecorder: any = null;
  
  /** Estado de guardado */
  saving = false;
  
  /** Tiempo transcurrido de grabación en milisegundos */
  elapsed = 0;
  
  /** Timer para actualizar el tiempo transcurrido */
  timer: any = null;

  /**
   * Constructor del componente
   * Inicializa el diálogo con los datos recibidos
   */
  constructor(
    public dialogRef: MatDialogRef<DialogGrabarNotaVozComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private notasVozService: NotasVozService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Alterna entre iniciar y detener la grabación
   * Controla el estado de grabación del audio
   */
  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  /**
   * Inicia la grabación de audio
   * Solicita permisos de micrófono y comienza a grabar
   */
  startRecording() {
    // Limpiar datos anteriores
    this.audioChunks = [];
    this.audioBlob = null;
    this.audioUrl = null;
    this.elapsed = 0;
    
    // Solicitar acceso al micrófono
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      // Crear instancia del MediaRecorder
      this.mediaRecorder = new (window as any).MediaRecorder(stream);
      this.mediaRecorder.start();
      this.isRecording = true;
      
      // Iniciar timer para el tiempo transcurrido
      this.timer = setInterval(() => this.elapsed += 1000, 1000);
      
      // Configurar evento para capturar datos de audio
      this.mediaRecorder.ondataavailable = (e: any) => {
        this.audioChunks.push(e.data);
      };
      
      // Configurar evento cuando se detiene la grabación
      this.mediaRecorder.onstop = () => {
        // Crear blob con los fragmentos de audio
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Crear URL para reproducción
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        
        // Actualizar estado
        this.isRecording = false;
        clearInterval(this.timer);
      };
    }).catch(() => {
      // Mostrar error si no se puede acceder al micrófono
      this.snackBar.open('No se pudo acceder al micrófono.', 'Cerrar', { duration: 3000 });
    });
  }

  /**
   * Detiene la grabación de audio
   * Finaliza la captura y procesa el audio grabado
   */
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  /**
   * Guarda la nota de voz grabada
   * Envía el archivo de audio al servidor
   */
  guardar() {
    if (!this.audioBlob) return;
    
    // Activar estado de guardado
    this.saving = true;
    
    // Preparar FormData para envío
    const formData = new FormData();
    formData.append('audio', this.audioBlob, 'nota_voz.webm');
    formData.append('turno_id', (this.data.turno.ID || this.data.turno.id_turno).toString());
    
    // Llamar al servicio para guardar la nota de voz
    this.notasVozService.grabarNotaVoz(formData).subscribe({
      next: () => {
        // Éxito: desactivar estado de guardado y mostrar mensaje
        this.saving = false;
        this.snackBar.open('Nota de voz guardada correctamente.', 'Cerrar', { duration: 2500 });
        
        // Cerrar diálogo con confirmación
        this.dialogRef.close(true);
      },
      error: () => {
        // Error: desactivar estado de guardado y mostrar mensaje de error
        this.saving = false;
        this.snackBar.open('Error al guardar la nota de voz.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  /**
   * Cierra el diálogo sin guardar
   * Cancela la operación de grabación
   */
  cerrar() {
    this.dialogRef.close();
  }
} 