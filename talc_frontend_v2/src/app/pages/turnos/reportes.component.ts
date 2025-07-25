/**
 * Componente Reportes - Estadísticas y visualización de datos de turnos
 *
 * Este componente permite visualizar estadísticas y reportes gráficos
 * sobre los turnos del sistema TALC, incluyendo:
 * - Distribución de turnos por estado (asistidos, cancelados, ausentes, agendados)
 * - Turnos por profesional y especialidad
 * - Porcentaje de asistencia por profesional
 * - Filtros por rango de fechas
 *
 * Utiliza ApexCharts para la visualización interactiva de datos.
 *
 * Funcionalidades principales:
 * - Filtros de fecha (desde/hasta)
 * - Gráficos de torta, barras y líneas
 * - Actualización dinámica de datos
 * - Visualización responsiva
 *
 * Arquitectura:
 * - Componente standalone
 * - Integración con ApexCharts y Angular Material
 * - Manejo reactivo de filtros y datos
 */

// Importaciones de Angular y librerías de gráficos
import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApexNonAxisChartSeries, ApexChart, ApexResponsive, ApexLegend, ApexAxisChartSeries, ApexXAxis, ApexYAxis, ApexStroke, ApexGrid, ApexTooltip, ApexPlotOptions, ApexDataLabels } from 'ng-apexcharts';

// Servicio de turnos y modelo de datos
import { TurnosService } from '../../services/turnos.service';
import { Turno } from '../../models/turno.model';

// Formularios y Material
import { FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

/**
 * Tipos de configuración para los diferentes gráficos ApexCharts
 */
export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
  legend: ApexLegend;
  colors?: string[];
};

export type LineChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  colors: string[];
};

export type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  colors: string[];
  legend: ApexLegend;
  tooltip: ApexTooltip;
};

/**
 * Componente principal de reportes y estadísticas de turnos
 */
@Component({
  selector: 'app-reportes',
  standalone: true,
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
  imports: [
    NgApexchartsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatIconModule
  ]
})
export class ReportesComponent implements OnInit {
  /** Opciones para el gráfico de torta de estados de turnos */
  public chartOptions: ChartOptions;
  /** Opciones para el gráfico de líneas (no usado en este template) */
  public lineChartOptions: LineChartOptions;
  /** Opciones para el gráfico de barras de turnos por profesional */
  public barChartOptions: BarChartOptions;
  /** Opciones para el gráfico de torta de profesionales */
  public profesionalesPieOptions: ChartOptions;
  /** Opciones para el gráfico de torta de especialidades */
  public especialidadesPieOptions: ChartOptions;
  /** Opciones para el gráfico de barras apiladas de asistencia por profesional */
  public asistenciaProfesionalOptions: BarChartOptions;
  /** Opciones para el gráfico de barras de horarios (no usado en este template) */
  public horarioBarOptions: BarChartOptions;
  /** Opciones para el gráfico de línea de ausentismo (no usado en este template) */
  public ausentismoLineOptions: LineChartOptions;
  /** Opciones para el gráfico de programados vs efectivos (no usado en este template) */
  public programadosVsEfectivosOptions: LineChartOptions;

  /** Filtro de fecha desde */
  public fechaDesde = new FormControl();
  /** Filtro de fecha hasta */
  public fechaHasta = new FormControl();
  /** Lista completa de turnos (sin filtrar) */
  private allTurnos: Turno[] = [];

  /**
   * Constructor: inicializa las opciones de los gráficos y servicios
   */
  constructor(private turnosService: TurnosService) {
    // Configuración inicial de los gráficos (colores, tipos, leyendas, etc.)
    this.chartOptions = {
      series: [0, 0, 0, 0],
      chart: {
        type: 'donut',
        height: 350
      },
      labels: ['Asistidos', 'Cancelados', 'Ausentes', 'Agendados'],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ],
      legend: {
        position: 'bottom'
      }
    };
    // Configuración de otros gráficos (línea, barras, torta, etc.)
    this.lineChartOptions = {
      series: [],
      chart: {
        height: 300,
        type: 'line',
        fontFamily: 'DM Sans,sans-serif',
        foreColor: '#a1aab2',
        toolbar: { show: false }
      },
      xaxis: { type: 'category', categories: [] },
      yaxis: {},
      stroke: { curve: 'straight', width: 2 },
      grid: { show: true, strokeDashArray: 0, borderColor: 'rgba(0,0,0,0.1)' },
      tooltip: { theme: 'dark' },
      colors: ['#06d79c', '#398bf7', '#FFAE1F', '#e53935']
    };
    this.barChartOptions = {
      series: [],
      chart: {
        height: 400,
        width: 500,
        type: 'bar',
        fontFamily: 'DM Sans,sans-serif',
        foreColor: '#a1aab2',
        stacked: false,
        toolbar: { show: false }
      },
      xaxis: { type: 'category', categories: [] },
      yaxis: {},
      plotOptions: { bar: { columnWidth: '40%', barHeight: '40%' } },
      dataLabels: { enabled: false },
      grid: { show: true, strokeDashArray: 0, borderColor: 'rgba(0,0,0,0.1)' },
      colors: ['#398bf7'],
      legend: { show: false },
      tooltip: { theme: 'dark' }
    };
    this.profesionalesPieOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 350
      },
      labels: [],
      colors: [
        '#5D87FF', // azul
        '#49BEFF', // celeste
        '#FFAE1F', // naranja
        '#13DEB9', // turquesa
        '#FA896B', // coral
        '#6C5FFC', // violeta
        '#FF5CA8', // rosa
        '#81D4FA', // azul claro
        '#A7FFEB', // verde agua
        '#FFD600'  // amarillo
      ],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ],
      legend: {
        position: 'bottom'
      }
    };
    this.especialidadesPieOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 350
      },
      labels: [],
      colors: [],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ],
      legend: {
        position: 'bottom'
      }
    };
    this.asistenciaProfesionalOptions = {
      series: [],
      chart: {
        height: 500,
        type: 'bar',
        stacked: true,
        stackType: '100%',
        fontFamily: 'DM Sans,sans-serif',
        foreColor: '#a1aab2',
        toolbar: { show: false }
      },
      xaxis: { type: 'category', categories: [] },
      yaxis: {},
      plotOptions: {
        bar: {
          columnWidth: '25%',
          barHeight: '40%'
        }
      },
      dataLabels: { enabled: false },
      grid: { show: true, strokeDashArray: 0, borderColor: 'rgba(0,0,0,0.1)' },
      colors: ['#06d79c', '#e53935', '#FFAE1F', '#398bf7'],
      legend: { show: true, position: 'bottom' },
      tooltip: { theme: 'dark' }
    };
    this.horarioBarOptions = {
      series: [],
      chart: {
        height: 300,
        type: 'bar',
        fontFamily: 'DM Sans,sans-serif',
        foreColor: '#a1aab2',
        stacked: false,
        toolbar: { show: false }
      },
      xaxis: { type: 'category', categories: [] },
      yaxis: {},
      plotOptions: { bar: { columnWidth: '40%', barHeight: '40%' } },
      dataLabels: { enabled: false },
      grid: { show: true, strokeDashArray: 0, borderColor: 'rgba(0,0,0,0.1)' },
      colors: ['#FFAE1F'],
      legend: { show: false },
      tooltip: { theme: 'dark' }
    };
    this.ausentismoLineOptions = {
      series: [],
      chart: {
        height: 300,
        type: 'line',
        fontFamily: 'DM Sans,sans-serif',
        foreColor: '#a1aab2',
        toolbar: { show: false }
      },
      xaxis: { type: 'category', categories: [] },
      yaxis: { min: 0, max: 100, labels: { formatter: (val: number) => val + '%' } },
      stroke: { curve: 'straight', width: 2 },
      grid: { show: true, strokeDashArray: 0, borderColor: 'rgba(0,0,0,0.1)' },
      tooltip: { theme: 'dark' },
      colors: ['#e53935']
    };
    this.programadosVsEfectivosOptions = {
      series: [],
      chart: {
        height: 300,
        type: 'line',
        fontFamily: 'DM Sans,sans-serif',
        foreColor: '#a1aab2',
        toolbar: { show: false }
      },
      xaxis: { type: 'category', categories: [] },
      yaxis: {},
      stroke: { curve: 'straight', width: 2 },
      grid: { show: true, strokeDashArray: 0, borderColor: 'rgba(0,0,0,0.1)' },
      tooltip: { theme: 'dark' },
      colors: ['#398bf7', '#06d79c']
    };
  }

  /**
   * Hook de inicialización: carga los turnos y configura los gráficos
   */
  ngOnInit(): void {
    this.turnosService.obtenerTurnos().subscribe((turnos: Turno[]) => {
      this.allTurnos = turnos;
      this.actualizarGraficosPorRango();
    });
    this.fechaDesde.valueChanges.subscribe(() => this.actualizarGraficosPorRango());
    this.fechaHasta.valueChanges.subscribe(() => this.actualizarGraficosPorRango());
  }

  /**
   * Actualiza todos los gráficos según el rango de fechas seleccionado
   * Filtra los turnos y recalcula los datos de cada gráfico
   */
  actualizarGraficosPorRango() {
    const desde = this.fechaDesde.value ? new Date(this.fechaDesde.value) : null;
    const hasta = this.fechaHasta.value ? new Date(this.fechaHasta.value) : null;
    let turnosFiltrados = this.allTurnos;
    if (desde) {
      turnosFiltrados = turnosFiltrados.filter(t => new Date(t.Fecha) >= desde);
    }
    if (hasta) {
      turnosFiltrados = turnosFiltrados.filter(t => new Date(t.Fecha) <= hasta);
    }

    // Donut chart (por estado)
    const counts = { Asistidos: 0, Cancelados: 0, Ausentes: 0, Agendados: 0 };
    turnosFiltrados.forEach(turno => {
      const estado = (turno.Estado || '').toLowerCase();
      if (estado === 'asistido') counts.Asistidos++;
      else if (estado === 'cancelado') counts.Cancelados++;
      else if (estado === 'ausente') counts.Ausentes++;
      else if (estado === 'agendado') counts.Agendados++;
    });
    this.chartOptions.series = [counts.Asistidos, counts.Cancelados, counts.Ausentes, counts.Agendados];

    // Bar chart (turnos por profesional)
    const profesionales: { [key: string]: number } = {};
    turnosFiltrados.forEach(turno => {
      if (turno.Profesional) {
        profesionales[turno.Profesional] = (profesionales[turno.Profesional] || 0) + 1;
      }
    });
    const profEntries = Object.entries(profesionales).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const profNames = profEntries.map(([name]) => name);
    const profCounts = profEntries.map(([, count]) => count);
    this.barChartOptions.series = [{ name: 'Turnos', data: profCounts }];
    this.barChartOptions.xaxis = {
      ...this.barChartOptions.xaxis,
      categories: profNames,
      labels: {
        show: true,
        rotate: -45,
        style: { fontSize: '12px' },
        formatter: (val: string) => val
      }
    };

    // Pie chart (turnos por profesional)
    function generateUniqueColors(n: number): string[] {
      return Array.from({ length: n }, (_, i) => `hsl(${Math.round(360 * i / n)}, 70%, 55%)`);
    }
    this.profesionalesPieOptions.series = profCounts;
    this.profesionalesPieOptions.labels = profNames;
    this.profesionalesPieOptions.colors = generateUniqueColors(profNames.length);

    // Pie chart (turnos por especialidad)
    const especialidades: { [key: string]: number } = {};
    turnosFiltrados.forEach(turno => {
      if (turno.Especialidad) {
        especialidades[turno.Especialidad] = (especialidades[turno.Especialidad] || 0) + 1;
      }
    });
    const espEntries = Object.entries(especialidades).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const espNames = espEntries.map(([name]) => name);
    const espCounts = espEntries.map(([, count]) => count);
    this.especialidadesPieOptions.series = espCounts;
    this.especialidadesPieOptions.labels = espNames;
    this.especialidadesPieOptions.colors = (Array.isArray(espNames) && espNames.length > 0 ? generateUniqueColors(espNames.length) : []) as any[];

    // Barras apiladas: porcentaje de asistencia por profesional
    const estadosAsistencia = ['Asistido', 'Cancelado', 'Ausente', 'Agendado'];
    // Filtrar y limpiar nombres de profesionales
    const topProfesionales = profNames.map(name => {
      if (!name || typeof name !== 'string' || name.trim() === '') return 'Sin nombre';
      return name;
    });
    console.log('Profesionales eje X:', topProfesionales);
    const seriesAsistencia = estadosAsistencia.map(estado => ({
      name: estado,
      data: topProfesionales.map(prof => turnosFiltrados.filter(t => t.Profesional === prof && t.Estado === estado).length)
    }));
    this.asistenciaProfesionalOptions.series = seriesAsistencia;
    this.asistenciaProfesionalOptions.xaxis = {
      type: 'category',
      categories: topProfesionales,
      labels: {
        show: true,
        rotate: -60,
        style: { fontSize: '12px' },
        formatter: (val: string) => val
      }
    };
    this.asistenciaProfesionalOptions.chart.width = 1100;
  }

  /**
   * Limpia los filtros de fecha
   */
  limpiarFechas() {
    this.fechaDesde.setValue(null);
    this.fechaHasta.setValue(null);
  }
} 