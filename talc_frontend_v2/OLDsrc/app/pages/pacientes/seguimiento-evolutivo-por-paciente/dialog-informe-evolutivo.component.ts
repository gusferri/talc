import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { InformesService } from '../../../services/informes.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dialog-informe-evolutivo',
  standalone: true,
  template: `
    <div class="dialog-wrapper">
      <h2 mat-dialog-title class="dialog-title">Informe Evolutivo</h2>
      <div mat-dialog-content class="dialog-content">
        <div class="info">
          <span class="paciente"><strong>Paciente:</strong> {{ data.paciente?.Apellido }}, {{ data.paciente?.Nombre }}</span>
          <span class="fecha"><strong>Fecha:</strong> {{ data.informe?.FechaGenerado | date:'dd/MM/yyyy' }}</span>
          <span class="profesional"><strong>Profesional:</strong> {{ data.informe?.Nombre }} {{ data.informe?.Apellido }}</span>
          <span class="tipo"><strong>Tipo de Informe:</strong> {{ data.informe?.NombreTipoInforme }}</span>
        </div>
        <mat-form-field appearance="outline" class="textarea-transcripcion">
          <mat-label>Resumen</mat-label>
          <textarea matInput rows="10" [(ngModel)]="data.informe.Resumen"></textarea>
        </mat-form-field>
      </div>
      <div mat-dialog-actions align="end" class="dialog-actions">
        <button mat-stroked-button color="primary" (click)="onSave()" [disabled]="saving">
          Guardar
        </button>
        <button mat-button (click)="onClose()" [disabled]="saving">
          Cerrar
        </button>
      </div>
    </div>
  `,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
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
  `]
})
export class DialogInformeEvolutivoComponent {
  saving = false;
  constructor(
    public dialogRef: MatDialogRef<DialogInformeEvolutivoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private informesService: InformesService,
    private snackBar: MatSnackBar
  ) {}

  onSave() {
    const id = this.data.informe?.ID;
    const resumen = this.data.informe?.Resumen;
    if (!id || !resumen) {
      this.snackBar.open('Faltan datos para guardar el informe.', 'Cerrar', { duration: 3000 });
      return;
    }
    this.saving = true;
    this.informesService.actualizarInforme(id, resumen).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Informe actualizado correctamente.', 'Cerrar', { duration: 2500 });
        this.dialogRef.close({ resumen });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Error al guardar el informe.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  onClose() {
    this.dialogRef.close();
  }
} 