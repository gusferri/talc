import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-error',
    standalone: true,
    imports: [RouterModule, MatButtonModule],
    templateUrl: './error.component.html'
})
export class AppErrorComponent {
    constructor(private router: Router) {}

    irALogin(): void {
        this.router.navigate(['/authentication/login']);
    }

    irADashboard(): void {
        this.router.navigate(['/dashboard']);
    }
}
