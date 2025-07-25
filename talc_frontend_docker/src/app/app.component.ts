import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'Modernize';

  constructor() {
    // Verificación temporal para debug
    console.log('🔧 Environment config:', {
      production: environment.production,
      apiBaseUrl: environment.apiBaseUrl
    });
  }
}
