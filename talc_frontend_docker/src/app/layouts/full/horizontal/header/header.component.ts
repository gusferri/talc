import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog } from '@angular/material/dialog';
import { navItems } from '../../vertical/sidebar/sidebar-data';
import { TranslateService } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { BrandingComponent } from '../../vertical/sidebar/branding.component';
import { AppSettings } from 'src/app/config';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-horizontal-header',
  imports: [RouterModule, TablerIconsModule, MaterialModule, BrandingComponent],
  templateUrl: './header.component.html',
})
export class AppHorizontalHeaderComponent {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  showFiller = false;

  @Output() optionsChange = new EventEmitter<AppSettings>();

  constructor(
    private settings: CoreService,
    private vsidenav: CoreService,
    public dialog: MatDialog,
    private translate: TranslateService
  ) {
  }

  openDialog() {
    const dialogRef = this.dialog.open(AppHorizontalSearchDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

  options = this.settings.getOptions();

  private emitOptions() {
    this.optionsChange.emit(this.options);
  }

  setlightDark(theme: string) {
    this.options.theme = theme;
    this.emitOptions();
  }

  nombreCompleto = localStorage.getItem('nombreCompleto') || '';
  rol = localStorage.getItem('rol') || '';
  email = localStorage.getItem('email') || '';

  openChangePasswordDialog() {
    // Lógica para abrir el diálogo de cambio de contraseña
    // Puedes reutilizar el método que ya abre el dialog en el login
    // Por ejemplo:
    // this.dialog.open(ChangePasswordDialogComponent, { width: '400px', disableClose: true });
  }

  logout() {
    localStorage.clear();
    window.location.href = '/authentication/login';
  }
}

@Component({
  selector: 'app-search-dialog',
  imports: [RouterModule, MaterialModule, TablerIconsModule, FormsModule],
  templateUrl: 'search-dialog.component.html',
})
export class AppHorizontalSearchDialogComponent {
  searchText: string = '';
  navItems = navItems;

  navItemsData = navItems.filter((navitem) => navitem.displayName);

  // filtered = this.navItemsData.find((obj) => {
  //   return obj.displayName == this.searchinput;
  // });
}
