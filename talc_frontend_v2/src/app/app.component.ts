import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    templateUrl: './app.component.html'
})
export class AppComponent {
  constructor() {
    // Limpieza: eliminar logs de inicialización
  }

  title = 'Modernize Angular Admin Template';
}
