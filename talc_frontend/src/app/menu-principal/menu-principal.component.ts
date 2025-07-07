import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-menu-principal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './menu-principal.component.html',
  styleUrls: ['./menu-principal.component.css']
})
export class MenuPrincipalComponent {
  constructor(private router: Router) {}

  navegar(ruta: string) {
    this.router.navigate(['/' + ruta]);
  }
}