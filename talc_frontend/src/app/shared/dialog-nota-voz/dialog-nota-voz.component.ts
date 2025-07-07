import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Component, Inject, signal, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotasVozService } from '../../pacientes/notas-voz.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dialog-nota-voz',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
  ],
  templateUrl: './dialog-nota-voz.component.html',
  styleUrl: './dialog-nota-voz.component.css'
})
export class DialogNotaVozComponent {
  grabando = false;
  private deteniendo = false;
  audioURL: string | null = null;
  mediaRecorder: any;
  audioChunks: any[] = [];
  tiempoGrabacion = 0; // En ms
  nivelAudio = 0; // [0, 1]
  mensaje = '';
  intervalId: any;
  analyser: any;
  audioContext: any;
  micStream: any;
  animationId: any;
  transcripcion: string = '';
  audioBlob: Blob | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DialogNotaVozComponent>,
    private notasVozService: NotasVozService,
    private cdr: ChangeDetectorRef
  ) {}

  comenzarGrabacion() {
    if (this.grabando || this.deteniendo) return; // Evita dobles clics
    this.mensaje = '';
    this.audioChunks = [];
    this.grabando = true;
    this.tiempoGrabacion = 0;

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      this.micStream = stream;
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      source.connect(this.analyser);

      this.mediaRecorder = new (window as any).MediaRecorder(stream);
      this.mediaRecorder.start();

      // Tiempo
      this.intervalId = setInterval(() => {
        this.tiempoGrabacion += 1000;
      }, 1000);

      // Nivel de audio dinámico
      const dataArray = new Uint8Array(this.analyser.fftSize);
      const animate = () => {
        this.analyser.getByteTimeDomainData(dataArray);
        // Calcula RMS simple
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        this.nivelAudio = rms;
        this.animationId = requestAnimationFrame(animate);
      };
      animate();

      // Guardar chunks
      this.mediaRecorder.ondataavailable = (e: any) => {
        this.audioChunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        console.log("Audio grabado:", this.audioBlob.size, "bytes");
        this.audioURL = URL.createObjectURL(this.audioBlob);

        // Limpiar recursos SOLO acá:
        if (this.intervalId) clearInterval(this.intervalId);
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.micStream) {
          this.micStream.getTracks().forEach((track: any) => track.stop());
        }
        if (this.audioContext) {
          this.audioContext.close();
        }
        this.grabando = false; // Ahora sí, forzás el refresco de Angular acá
        this.deteniendo = false; // <- Agregado aquí
        this.cdr.detectChanges();
      };
    }).catch((err) => {
      this.mensaje = 'No se pudo acceder al micrófono';
      this.grabando = false;
    });
  }

  detenerGrabacion() {
    if (!this.grabando || this.deteniendo) return;
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.deteniendo = true;
      this.mediaRecorder.stop();
    }
  }

  // Método limpiarGrabacion comentado porque solo se usa para cerrar el diálogo
  /*
  limpiarGrabacion() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.micStream) {
      this.micStream.getTracks().forEach((track: any) => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
  */

  guardarNotaVoz() {
    if (!this.audioBlob || !this.data?.sesion?.ID) return;
    this.mensaje = 'Procesando...';
    this.notasVozService.subirNotaVoz(this.data.sesion.ID, this.audioBlob)
      .subscribe({
        next: (resp: any) => {
          // resp debe traer { texto, id }
          this.dialogRef.close({ transcripcion: resp.texto, idNotaVoz: resp.id, turnoId: this.data.sesion.ID });
        },
        error: (err: any) => {
          this.mensaje = 'Error subiendo la nota de voz';
        }
      }
    );
  }

  cerrarDialog() {
    this.dialogRef.close();
  }
}