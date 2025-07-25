import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdjuntosService, AdjuntoBackend } from '../../services/adjuntos.service';

@Component({
  selector: 'app-adjuntar-archivo-dialog',
  standalone: true,
  template: `
    <div class="dialog-wrapper">
      <h2 mat-dialog-title class="dialog-title">Documentación del Paciente</h2>
      <div mat-dialog-content class="dialog-content">
        <div *ngIf="adjuntos.length > 0" class="adjuntos-list">
          <h3 class="adjuntos-title">Archivos adjuntos</h3>
          <ul>
            <li *ngFor="let adj of adjuntos">
              <mat-icon>attach_file</mat-icon>
              <span>{{ adj.Nombre }}</span>
              <button mat-icon-button (click)="verAdjunto(adj)" matTooltip="Ver archivo">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button (click)="descargarAdjunto(adj)" matTooltip="Descargar">
                <mat-icon>download</mat-icon>
              </button>
              <button mat-icon-button (click)="eliminarAdjunto(adj)" matTooltip="Eliminar" color="warn">
                <mat-icon>delete</mat-icon>
              </button>
            </li>
          </ul>
        </div>
        <div class="nuevo-adjunto">
          <h3 class="nuevo-title">Adjuntar nuevo archivo</h3>
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
            <button mat-stroked-button color="primary" (click)="fileInput.click()">
              Seleccionar archivo
            </button>
            <input #fileInput type="file" style="display: none" (change)="onFileSelected($event)" />
            <mat-form-field appearance="fill" style="flex: 1; margin-top: 0;">
              <mat-label>Descripción del archivo</mat-label>
              <input matInput [(ngModel)]="descripcionArchivo" placeholder="Ej: DNI, certificado, etc.">
            </mat-form-field>
          </div>
          <div *ngIf="file" style="margin-top: 10px; font-size: 14px;">
            <p><strong>Archivo seleccionado:</strong> {{ file.name }}</p>
            <p><strong>Tamaño:</strong> {{ file.size / 1024 | number:'1.0-2' }} KB</p>
          </div>
        </div>
      </div>
      <div mat-dialog-actions align="end" class="dialog-actions">
        <button mat-stroked-button (click)="onCancelar()">Cancelar</button>
        <button mat-raised-button color="primary" (click)="onGuardar()" [disabled]="!file || !descripcionArchivo.trim() || cargando">
          <mat-icon *ngIf="cargando">hourglass_empty</mat-icon>
          {{ cargando ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>
  `,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule],
  styles: [
    `.dialog-wrapper { max-width: 520px; min-width: 350px; padding: 28px 24px 18px 24px; box-sizing: border-box; }
     .dialog-title { font-size: 1.3rem; font-weight: 600; margin-bottom: 0.5rem; color: #333; }
     .dialog-content { margin-bottom: 18px; }
     .adjuntos-list { margin-bottom: 18px; }
     .adjuntos-title { font-size: 1.1rem; margin-bottom: 8px; }
     ul { list-style: none; padding: 0; margin: 0; }
     li { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
     .nuevo-title { font-size: 1.1rem; margin-bottom: 8px; }
     .dialog-actions { margin-top: 18px; display: flex; gap: 12px; justify-content: flex-end; padding-bottom: 4px; }
     button[mat-stroked-button], button[mat-raised-button] { min-width: 110px; }
    `]
})
export class AdjuntarArchivoDialogComponent implements OnInit {
  adjuntos: AdjuntoBackend[] = [];
  file: File | null = null;
  descripcionArchivo: string = '';
  cargando: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AdjuntarArchivoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idPaciente: number },
    private dialog: MatDialog,
    private adjuntosService: AdjuntosService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    console.log('AdjuntarArchivoDialog - Datos recibidos:', this.data);
    console.log('ID del paciente:', this.data.idPaciente);
    this.cargarAdjuntos();
  }

  cargarAdjuntos() {
    console.log('Cargando adjuntos para paciente ID:', this.data.idPaciente);
    this.adjuntosService.obtenerAdjuntos(this.data.idPaciente).subscribe({
      next: (adjuntos: AdjuntoBackend[]) => {
        console.log('Adjuntos cargados:', adjuntos);
        this.adjuntos = adjuntos;
      },
      error: (error: any) => {
        console.error('Error al cargar adjuntos:', error);
        this.snackBar.open('Error al cargar los adjuntos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
    }
  }

  onCancelar(): void {
    this.dialogRef.close();
  }

  onGuardar(): void {
    if (!this.file || !this.descripcionArchivo.trim()) return;

    this.cargando = true;
    const username = localStorage.getItem('username') || '';
    
    const formData = new FormData();
    formData.append('archivo', this.file);
    formData.append('titulo', this.descripcionArchivo);
    formData.append('id_paciente', this.data.idPaciente.toString());
    formData.append('username', username);

    this.adjuntosService.subirAdjunto(formData).subscribe({
      next: (response) => {
        this.snackBar.open('Archivo subido correctamente', 'Cerrar', { duration: 3000 });
        this.cargarAdjuntos(); // Recargar la lista
        this.file = null;
        this.descripcionArchivo = '';
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al subir archivo:', error);
        this.snackBar.open('Error al subir el archivo', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      }
    });
  }

  descargarAdjunto(adj: AdjuntoBackend) {
    this.adjuntosService.descargarAdjunto(adj.ID).subscribe({
      next: (blob) => {
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

  verAdjunto(adj: AdjuntoBackend) {
    this.adjuntosService.visualizarAdjunto(adj.ID).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
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

  eliminarAdjunto(adj: AdjuntoBackend) {
    if (confirm(`¿Estás seguro de que quieres eliminar "${adj.Nombre}"?`)) {
      this.adjuntosService.eliminarAdjunto(adj.ID).subscribe({
        next: () => {
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

@Component({
  selector: 'app-visor-adjunto-dialog',
  standalone: true,
  template: `
    <div style="padding: 24px; min-width: 350px; max-width: 600px;">
      <h2 mat-dialog-title style="font-size: 1.2rem; font-weight: 600; margin-bottom: 18px;">{{ data.titulo }}</h2>
      <ng-container [ngSwitch]="tipoAdjunto">
        <img *ngSwitchCase="'img'" [src]="data.url" alt="Imagen adjunta" style="max-width: 100%; max-height: 400px; display: block; margin: 0 auto;" />
        <iframe *ngSwitchCase="'pdf'" [src]="data.url" style="width: 100%; height: 400px; border: none;"></iframe>
        <div *ngSwitchDefault style="text-align: center; color: #888;">No se puede visualizar este tipo de archivo.<br>Puedes descargarlo para abrirlo en tu dispositivo.</div>
      </ng-container>
      <div style="margin-top: 18px; text-align: right;">
        <button mat-button (click)="dialogRef.close()">Cerrar</button>
      </div>
    </div>
  `,
  imports: [CommonModule, MatButtonModule],
})
export class VisorAdjuntoDialogComponent {
  tipoAdjunto: 'img' | 'pdf' | 'otro' = 'otro';
  constructor(
    public dialogRef: MatDialogRef<VisorAdjuntoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Lógica simple para demo: detectar tipo por extensión
    if (data.titulo?.toLowerCase().endsWith('.pdf')) this.tipoAdjunto = 'pdf';
    else if (data.titulo?.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) this.tipoAdjunto = 'img';
    else this.tipoAdjunto = 'otro';
  }
} 