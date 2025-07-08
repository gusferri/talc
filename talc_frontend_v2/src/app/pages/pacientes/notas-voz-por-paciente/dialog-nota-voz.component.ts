import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-dialog-nota-voz',
  standalone: true,
  template: `
    <div class="dialog-wrapper">
      <h2 mat-dialog-title class="dialog-title">Transcripción de la nota de voz</h2>
      <div mat-dialog-content class="dialog-content">
        <div class="info">
          <span class="paciente"><mat-icon>person</mat-icon> {{ data.paciente?.Apellido }}, {{ data.paciente?.Nombre }}</span>
          <span class="fecha"><mat-icon>event</mat-icon> {{ (data.turno.Fecha || data.turno.fecha) | date:'dd/MM/yyyy' }}</span>
          <span class="hora"><mat-icon>schedule</mat-icon> {{ data.turno.Hora || data.turno.hora }}</span>
        </div>
        <div *ngIf="loading" class="loading-spinner"><mat-spinner diameter="40"></mat-spinner></div>
        <mat-form-field appearance="outline" class="textarea-transcripcion" *ngIf="!loading">
          <mat-label>Transcripción</mat-label>
          <textarea matInput rows="8" [(ngModel)]="transcripcion" cdkTextareaAutosize></textarea>
        </mat-form-field>
      </div>
      <div mat-dialog-actions align="end" class="dialog-actions">
        <button mat-stroked-button color="primary" (click)="guardar()">
          <mat-icon>save</mat-icon> Guardar
        </button>
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
    .dialog-wrapper {
      max-width: 600px;
      min-width: 400px;
      padding: 32px 28px 20px 28px;
      box-sizing: border-box;
    }
    .dialog-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }
    .dialog-content {
      padding: 0 2px 0 2px;
      margin-bottom: 18px;
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
    .textarea-transcripcion {
      width: 100%;
      margin-bottom: 8px;
      background: #faf9f6;
      border-radius: 10px;
    }
    textarea[matInput] {
      background: #faf9f6;
      border-radius: 10px;
      font-size: 1rem;
      padding: 12px;
      min-height: 120px;
      max-height: 300px;
      resize: vertical;
    }
    .dialog-actions {
      margin-top: 18px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding-bottom: 4px;
    }
    button[mat-stroked-button] {
      font-weight: 500;
      min-width: 120px;
    }
    button[mat-button] {
      min-width: 90px;
    }
    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 18px;
    }
  `]
})
export class DialogNotaVozComponent {
  transcripcion: string = '';
  loading: boolean = false;
  constructor(
    public dialogRef: MatDialogRef<DialogNotaVozComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.transcripcion = data.transcripcion || '';
    this.loading = data.loading || false;
  }

  guardar() {
    this.dialogRef.close({ transcripcion: this.transcripcion });
  }

  cerrar() {
    this.dialogRef.close();
  }
} 