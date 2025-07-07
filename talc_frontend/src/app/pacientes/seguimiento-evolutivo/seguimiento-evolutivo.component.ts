import { Component, inject, ViewEncapsulation } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { PacienteService } from '../paciente.service';
import { InformesService } from '../informes.service';
import { GenerarInformeRequest, GenerarInformeResponse } from '../informes.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import {MatRadioModule} from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';


@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-seguimiento-evolutivo',
  standalone: true,
  templateUrl: './seguimiento-evolutivo.component.html',
  styleUrl: './seguimiento-evolutivo.component.css',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatRadioModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule
  ],
  providers: [PacienteService, InformesService],
})
export class SeguimientoEvolutivoComponent {
  pacienteControl = new FormControl('');
  tipoInformeControl = new FormControl(1);
  pacientesFiltrados: any[] = [];
  pacienteSeleccionado: any = null;
  informes: any[] = [];
  informeSeleccionado: any = null;
  idInforme: number | null = null;
  profesionalId: number | null = null; // Agrega esta propiedad a la clase
  private pacienteService = inject(PacienteService);
  private informesService = inject(InformesService);
  pacientesProfesional: any[] = [];
  displayedColumns: string[] = ['fecha', 'tipoInforme', 'profesional', 'ver'];
  informesOriginal: any[] = []; // Para guardar todos los informes sin filtrar
  informe: string = '';


  constructor() {
    const shortname = localStorage.getItem('username');

    if (shortname) {
      this.pacienteService.obtenerPacientesPorProfesional(shortname).subscribe((pacientes: any[]) => {
        this.pacientesProfesional = pacientes;
      });
    }

    this.pacienteControl.valueChanges
      .pipe(
        debounceTime(300),
        switchMap(value => {
          if (typeof value === 'string' && value.length > 1) {
            // Filtra solo sobre los pacientes de la profesional
            const filtro = value.toLowerCase();
            return of(
              this.pacientesProfesional.filter(p =>
                (`${p.Nombre} ${p.Apellido}`.toLowerCase().includes(filtro) ||
                `${p.Apellido} ${p.Nombre}`.toLowerCase().includes(filtro))
              )
            );
          } else {
            return of([]);
          }
        })
      )
    .subscribe((pacientes: any[]) => {
      this.pacientesFiltrados = pacientes;
    });

    // Suscripción para filtrar informes al cambiar el radio
    this.tipoInformeControl.valueChanges.subscribe(valor => {
      this.filtrarInformesPorTipo(valor, this.profesionalId);
    });
  }

  displayPaciente(paciente: any): string {
    return paciente ? `${paciente.Apellido}, ${paciente.Nombre}` : '';
  }

  onPacienteSeleccionado(event: any) {
    const paciente = event.option.value;
    this.pacienteSeleccionado = paciente;
    this.informes = [];

    const username = localStorage.getItem('username');
    if (paciente && username) {
      this.pacienteService.obtenerProfesionalPorUsername(username).subscribe((profesional: any) => {
        if (profesional && profesional.ID) {
          this.profesionalId = profesional.ID; // Guarda el ID del profesional logueado
          this.informesService.getInformesPorPaciente(paciente.ID).subscribe((informes: any) => {
            const todosLosInformes = Array.isArray(informes) ? informes : (informes?.informes || []);
            this.informesOriginal = todosLosInformes
              .sort((a: any, b: any) => {
                const fechaA = new Date(a.FechaGenerado || a.fechaGenerado);
                const fechaB = new Date(b.FechaGenerado || b.fechaGenerado);
                return fechaB.getTime() - fechaA.getTime();
              });

            // Aplica el filtro inicial según el radio seleccionado
            this.filtrarInformesPorTipo(this.tipoInformeControl.value, this.profesionalId);
          });
        }
      });
    }
  }

  filtrarInformesPorTipo(tipo: string | number | null, profesionalId: number | null = this.profesionalId) {
    if (!tipo || !this.informesOriginal) return;
    const tipoNum = typeof tipo === 'string' ? parseInt(tipo, 10) : tipo;
    if (tipoNum === 1) {
      // Solo tipo 1 del profesional logueado
      this.informes = this.informesOriginal.filter(i =>
        i.TipoInforme === 1 && i.ID_Profesional === profesionalId
      );
    } else if (tipoNum === 2) {
      // Tipo 2 de cualquier profesional + tipo 1 solo del profesional logueado
      this.informes = this.informesOriginal.filter(i =>
        (i.TipoInforme === 2) ||
        (i.TipoInforme === 1 && i.ID_Profesional === profesionalId)
      );
    }
  }

  limpiarFormulario() {
    location.reload();
  }

    verInforme(informe: any): void {
    console.log('Ver informe:', informe);
    this.informeSeleccionado = { ...informe };
    this.idInforme = informe.ID;
    this.informe = informe.Resumen || '';
  }

  guardarEdicionInforme() {
    if (this.idInforme && this.informe) {
              console.log('Informe actualizado:', this.informe),
        console.log('ID del informe:', this.idInforme),
      this.informesService.actualizarInforme(this.idInforme, this.informe).subscribe({
        next: (response) => {
          console.log('Informe actualizado correctamente:', response);
        },
        error: (error) => {
          console.error('Error al actualizar el informe:', error);
        }
      });
    } else {
      console.warn('ID del informe o contenido del informe no están definidos');
    }
  }
  generarNuevoInforme() {
    if (!this.pacienteSeleccionado || !this.profesionalId) {
      console.warn('Debe seleccionar un paciente y asegurarse de que el profesional esté cargado.');
      return;
    }

    const payload: GenerarInformeRequest = {
      ID_Paciente: this.pacienteSeleccionado.ID,
      ID_Profesional: this.profesionalId,
      TipoInforme: this.tipoInformeControl.value === 2 ? 'interdisciplinario' : 'area'
    };

    console.log('📤 Enviando solicitud para generar nuevo informe IA:', payload);

    this.informesService.createInformeIA(payload).subscribe({
      next: (res) => {
        console.log('📝 Informe generado exitosamente:', res.resumen);
        this.informe = res.resumen;
        this.idInforme = null; // Se cargará con el nuevo listado si es necesario
      },
      error: (err) => {
        console.error('❌ Error al generar informe:', err);
      }
    });
  }
}