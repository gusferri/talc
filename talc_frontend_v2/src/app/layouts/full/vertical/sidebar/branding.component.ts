import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';

@Component({
  selector: 'app-branding',
  imports: [],
  template: `
    <div style="display: flex; justify-content: center; align-items: center; padding: 20px 0 12px 0; min-height: 80px;">
      <a href="/" style="display: flex; align-items: center; justify-content: center; width: 100%;">
        <img
          src="assets/images/logos/logo_talc.png"
          alt="TALC Logo"
          style="max-height: 80px; max-width: 90%; width: auto; display: block; margin: 0 auto; object-fit: contain;"
        />
      </a>
    </div>
  `,
})
export class BrandingComponent {
  options = this.settings.getOptions();
  constructor(private settings: CoreService) {}
}
