import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule, MatNavList, MatListItem } from '@angular/material/list';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatNavList,
    MatListItem
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  esProfesional: boolean = false;

  constructor(public router: Router) {
    const esProfesional = localStorage.getItem('esProfesional');
    this.esProfesional = esProfesional === 'true';
  }

  get esRutaTurnos(): boolean {
    return this.router.url.startsWith('/turnos');
  }

  get esRutaPacientes(): boolean {
    return this.router.url.startsWith('/pacientes');
  }
}