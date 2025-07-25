import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotasVozService } from '../../../services/notas-voz.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog-grabar-nota-voz',
  standalone: true,
  template: `
    <div class="dialog-wrapper">
      <h2 mat-dialog-title class="dialog-title">Grabar nueva nota de voz</h2>
      <div class="info">
        <span class="paciente"><mat-icon>person</mat-icon> {{ data.paciente?.Apellido }}, {{ data.paciente?.Nombre }}</span>
        <span class="fecha"><mat-icon>event</mat-icon> {{ (data.turno.Fecha || data.turno.fecha) | date:'dd/MM/yyyy' }}</span>
        <span class="hora"><mat-icon>schedule</mat-icon> {{ data.turno.Hora || data.turno.hora }}</span>
      </div>
      <div class="recorder-section">
        <button mat-fab color="warn" (click)="toggleRecording()">
          <mat-icon *ngIf="!isRecording">mic</mat-icon>
          <mat-icon *ngIf="isRecording">stop</mat-icon>
        </button>
        <div class="rec-indicator" *ngIf="isRecording">
          <span class="dot"></span> Grabando... {{ elapsed | date:'mm:ss':'UTC' }}
        </div>
        <audio *ngIf="audioUrl" [src]="audioUrl" controls style="margin-top: 16px;"></audio>
      </div>
      <div class="dialog-actions">
        <button mat-stroked-button color="primary" (click)="guardar()" [disabled]="!audioBlob || saving">
          <mat-icon>save</mat-icon> Guardar
        </button>
        <button mat-button (click)="cerrar()" [disabled]="saving">
          <mat-icon>close</mat-icon> Cancelar
        </button>
      </div>
    </div>
  `,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  styles: [`
    .dialog-wrapper {
      max-width: 500px;
      min-width: 350px;
      padding: 32px 24px 20px 24px;
      box-sizing: border-box;
    }
    .dialog-title {
      font-size: 1.4rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }
    .info {
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
      margin-bottom: 18px;
      font-size: 1rem;
      color: #555;
      align-items: center;
    }
    .info mat-icon {
      font-size: 18px;
      vertical-align: middle;
      margin-right: 4px;
      color: #aa262b;
    }
    .recorder-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 18px;
    }
    .rec-indicator {
      margin-top: 12px;
      color: #c62828;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dot {
      width: 12px;
      height: 12px;
      background: #c62828;
      border-radius: 50%;
      display: inline-block;
      animation: blink 1s infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.2; }
    }
    .dialog-actions {
      margin-top: 18px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
    button[mat-stroked-button] {
      font-weight: 500;
      min-width: 120px;
    }
    button[mat-button] {
      min-width: 90px;
    }
  `]
})
export class DialogGrabarNotaVozComponent {
  isRecording = false;
  audioChunks: Blob[] = [];
  audioBlob: Blob | null = null;
  audioUrl: string | null = null;
  mediaRecorder: any = null;
  saving = false;
  elapsed = 0;
  timer: any = null;

  constructor(
    public dialogRef: MatDialogRef<DialogGrabarNotaVozComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private notasVozService: NotasVozService,
    private snackBar: MatSnackBar
  ) {}

  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    this.audioChunks = [];
    this.audioBlob = null;
    this.audioUrl = null;
    this.elapsed = 0;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.mediaRecorder = new (window as any).MediaRecorder(stream);
      this.mediaRecorder.start();
      this.isRecording = true;
      this.timer = setInterval(() => this.elapsed += 1000, 1000);
      this.mediaRecorder.ondataavailable = (e: any) => {
        this.audioChunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        this.isRecording = false;
        clearInterval(this.timer);
      };
    }).catch(() => {
      this.snackBar.open('No se pudo acceder al micrófono.', 'Cerrar', { duration: 3000 });
    });
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  guardar() {
    if (!this.audioBlob) return;
    this.saving = true;
    const formData = new FormData();
    formData.append('audio', this.audioBlob, 'nota_voz.webm');
    formData.append('turno_id', (this.data.turno.ID || this.data.turno.id_turno).toString());
    this.notasVozService.grabarNotaVoz(formData).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Nota de voz guardada correctamente.', 'Cerrar', { duration: 2500 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Error al guardar la nota de voz.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  cerrar() {
    this.dialogRef.close();
  }
} 