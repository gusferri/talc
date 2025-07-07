import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
// Removed MatCardModule as it does not exist
import { FormsModule } from '@angular/forms';
import { PacienteService } from '../paciente.service';

@Component({
  selector: 'app-adjuntar-archivo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    //MatCardModule,
    FormsModule,
  ],
  templateUrl: './adjuntar-archivo-dialog.component.html',
})
export class AdjuntarArchivoDialogComponent {
  pacienteId!: number;
  username!: string;
  file: File | null = null;
  previewURL: string | null = null;
  isImage = false;
  fileSelected: boolean = false;
  descripcionArchivo: string = '';

  constructor(
    private dialogRef: MatDialogRef<AdjuntarArchivoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private pacienteService: PacienteService
  ) {
    this.pacienteId = data.pacienteId;
    this.username = localStorage.getItem('username') ?? '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.file = input.files[0]; // Obtén el archivo seleccionado
      this.fileSelected = true;
      this.isImage = this.file.type.startsWith('image/'); // Verifica si es una imagen

      // Genera una URL de vista previa si es una imagen
      if (this.isImage) {
        const reader = new FileReader();
        reader.onload = () => {
          this.previewURL = reader.result as string; // Asigna la URL de vista previa
        };
        reader.readAsDataURL(this.file); // Lee el archivo como DataURL
      } else {
        this.previewURL = null; // No hay vista previa para archivos no imagen
      }
    }
  }

  onCancelar(): void {
    this.dialogRef.close();
  }

  onGuardar(): void {
    if (this.file && this.descripcionArchivo.trim()) {
      const formData = new FormData();
      formData.append('archivo', this.file);
      formData.append('titulo', this.descripcionArchivo); // campo esperado por backend
      formData.append('nombreOriginal', this.file.name);
      formData.append('id_paciente', this.pacienteId.toString());
      formData.append('username', this.username);

      this.pacienteService.adjuntarArchivo(formData).subscribe({
        next: (res) => {
          console.log('✅ Documento subido:', res);
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('❌ Error al subir documento:', err);
        }
      });
    }
  }
}