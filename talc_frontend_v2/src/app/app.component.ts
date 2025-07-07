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
    console.log('=== APP COMPONENT INITIALIZED ===');
    console.log('localStorage en app.component:', {
      usuario: localStorage.getItem('usuario'),
      username: localStorage.getItem('username'),
      nombreCompleto: localStorage.getItem('nombreCompleto')
    });
  }

  title = 'Modernize Angular Admin Template';
}
