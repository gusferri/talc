import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-snackbar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="snackbar-wrapper">
      <mat-icon *ngIf="data?.icon" class="snackbar-icon">{{ data.icon }}</mat-icon>
      <span class="snackbar-message">{{ data?.message }}</span>
    </div>
  `,
  styles: [`
    .snackbar-wrapper {
      display: flex;
      align-items: center;
      padding: 12px 24px;
      background-color: #f5f5f5;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .snackbar-icon {
      margin-right: 10px;
      color: green;
    }

    .snackbar-message {
      font-weight: bold;
      font-size: 16px;
      color: #222;
    }
  `]
})
export class CustomSnackbarComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {}
}