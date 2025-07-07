import { Component, LOCALE_ID, ViewEncapsulation, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NgChartsModule } from 'ng2-charts';
import { ChartType, ChartOptions, ChartData } from 'chart.js';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { registerLocaleData } from '@angular/common';
import localeEsAR from '@angular/common/locales/es-AR';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import * as _moment from 'moment';
import 'moment/locale/es';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    NgChartsModule,
    MatRadioModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatButtonModule,
    MatCardModule
  ],

  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css',
  encapsulation: ViewEncapsulation.None 
})
export class ReportesComponent implements OnInit {

  modoSeleccion: string = 'uno';
  fechaInicio: string = '';
  fechaFin: string = '';

  pacienteSeleccionado: any = null;
  profesionalSeleccionado: any = null;
  especialidadSeleccionada: any = null;
  estadoSeleccionado: string = '';

  pacientes: any[] = [];
  profesionales: any[] = [];
  especialidades: any[] = [];

  public grafanaUrl!: SafeResourceUrl;
  public grafanaGraficoTortaUrl!: SafeResourceUrl;
  public grafanaGraficoBarrasUrl!: SafeResourceUrl;
  public grafanaGraficoTortaAsistenciaUrl!: SafeResourceUrl;
  public grafanaGraficoBarrasAsistenciaUrl!: SafeResourceUrl;

  constructor(private http: HttpClient, private adapter: DateAdapter<any>, private sanitizer: DomSanitizer) {
    this.adapter.setLocale('es');
  }

  ngOnInit(): void {
    this.cargarPacientes();
    this.cargarProfesionales();

    // Setear fecha inicio y fecha fin automáticamente
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0); // 0 da el último día del mes anterior al mes 1 (es decir, el mes actual)
  
    this.fechaInicio = primerDiaMes.toISOString().substring(0, 10); // formato 'YYYY-MM-DD'
    this.fechaFin = ultimoDiaMes.toISOString().substring(0, 10);

    this.actualizarGrafanaUrl(); // Ya carga los reportes automáticamente
  }

  cargarPacientes() {
    this.http.get<any[]>('http://192.168.2.41:8000/turnos/pacientes').subscribe(data => {
      this.pacientes = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
  }

  cargarProfesionales() {
    this.http.get<any[]>('http://192.168.2.41:8000/turnos/profesionales').subscribe(data => {
      this.profesionales = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
  }

  actualizarGrafanaUrl() {
    let paciente = this.pacienteSeleccionado && this.pacienteSeleccionado !== 'Todos' ? this.pacienteSeleccionado : '$__all';
    let profesional = this.profesionalSeleccionado && this.profesionalSeleccionado !== 'Todos' ? this.profesionalSeleccionado : '$__all';
    let estado = this.estadoSeleccionado && this.estadoSeleccionado !== 'Todos' ? this.estadoSeleccionado : '$__all';

    // Parseo las fechas de la interfaz
    const from = this.fechaInicio ? new Date(this.fechaInicio).getTime() : '';
    const to = this.fechaFin ? new Date(this.fechaFin).getTime() : '';

    if (!from || !to) {
      alert('Por favor seleccioná Fecha Inicio y Fecha Fin');
      return;
    }

    const baseGrafanaUrl = `http://192.168.2.40:3000/d-solo/bek6ebr03b1mod/tabla-turnos?orgId=1&from=${from}&to=${to}&timezone=browser`;

    const urlTabla = `${baseGrafanaUrl}&var-Paciente=${encodeURIComponent(paciente)}&var-Profesional=${encodeURIComponent(profesional)}&var-Estado=${encodeURIComponent(estado)}&panelId=1&__feature.dashboardSceneSolo`;
    const urlTorta = `${baseGrafanaUrl}&var-Paciente=${encodeURIComponent(paciente)}&var-Profesional=${encodeURIComponent(profesional)}&var-Estado=${encodeURIComponent(estado)}&panelId=2&__feature.dashboardSceneSolo`;
    const urlBarras = `${baseGrafanaUrl}&var-Paciente=${encodeURIComponent(paciente)}&var-Profesional=${encodeURIComponent(profesional)}&var-Estado=${encodeURIComponent(estado)}&panelId=3&__feature.dashboardSceneSolo`;
    const urlTortaAsistencia = `${baseGrafanaUrl}&var-Paciente=${encodeURIComponent(paciente)}&var-Profesional=${encodeURIComponent(profesional)}&var-Estado=${encodeURIComponent(estado)}&panelId=4&__feature.dashboardSceneSolo`;
    const urlBarrasAsistencia = `${baseGrafanaUrl}&var-Paciente=${encodeURIComponent(paciente)}&var-Profesional=${encodeURIComponent(profesional)}&var-Estado=${encodeURIComponent(estado)}&panelId=5&__feature.dashboardSceneSolo`;

    this.grafanaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlTabla);
    this.grafanaGraficoTortaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlTorta);
    this.grafanaGraficoBarrasUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlBarras);
    this.grafanaGraficoTortaAsistenciaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlTortaAsistencia);
    this.grafanaGraficoBarrasAsistenciaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlBarrasAsistencia);
  }

  exportarExcel(): void {
    const from = this.fechaInicio;
    const to = this.fechaFin;
    const paciente = this.pacienteSeleccionado || 'Todos';
    const profesional = this.profesionalSeleccionado || 'Todos';
    const estado = this.estadoSeleccionado || 'Todos';

    if (!from || !to) {
      alert('Por favor seleccioná Fecha Inicio y Fecha Fin para exportar');
      return;
    }

    const url = `http://192.168.2.41:8000/api/exportarTurnos?paciente=${encodeURIComponent(paciente)}&profesional=${encodeURIComponent(profesional)}&estado=${encodeURIComponent(estado)}&fecha_inicio=${from}&fecha_fin=${to}`;

    this.http.get(url, { responseType: 'blob' }).subscribe((blob: Blob) => {
      FileSaver.saveAs(blob, `ReporteTurnos_${new Date().toISOString().substring(0, 10)}.xlsx`);
    });
  }

  limpiarFiltros(): void {
//    if (confirm('¿Seguro que querés limpiar los filtros y recargar la página?')) {
      window.location.reload();
//    }
  }
}