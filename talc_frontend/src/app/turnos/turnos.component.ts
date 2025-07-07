import { OnInit } from '@angular/core';
import { TurnosService } from '../turnos/services/turnos.service';
import { Turno } from '../models/turno.model';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.css']
})
export class TurnosComponent implements OnInit {
  turnos: Turno[] = [];

  constructor(private turnosService: TurnosService) {}

  ngOnInit(): void {
    this.turnosService.obtenerTurnos().subscribe({
      next: (data) => {
        this.turnos = data;
      },
      error: (error) => {
        console.error('Error al obtener turnos:', error);
      }
    });
  }
}