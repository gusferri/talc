/**
 * Configuración principal de la aplicación TALC
 * 
 * Este archivo contiene toda la configuración necesaria para inicializar la aplicación
 * Angular, incluyendo providers, módulos, rutas y configuraciones específicas del
 * framework y librerías externas.
 * 
 * Funcionalidades configuradas:
 * - Sistema de rutas y navegación
 * - Cliente HTTP para peticiones al backend
 * - Animaciones y transiciones
 * - Internacionalización (i18n)
 * - Material Design components
 * - Iconos y scrollbars personalizados
 * - Formularios reactivos y template-driven
 * - Configuración de zona de detección de cambios
 * 
 * Responsabilidades:
 * - Centralizar toda la configuración de la aplicación
 * - Proporcionar servicios y módulos necesarios
 * - Configurar el comportamiento del framework
 * - Integrar librerías externas
 */

// Importaciones del core de Angular
import {
  ApplicationConfig,           // Tipo para la configuración de la aplicación
  provideZoneChangeDetection,  // Provider para configuración de zona de detección
  importProvidersFrom,         // Función para importar providers de módulos
  LOCALE_ID,                   // Token para configuración de locale
} from '@angular/core';

// Importaciones para HTTP y cliente
import {
  HttpClient,                  // Cliente HTTP de Angular
  provideHttpClient,           // Provider para el cliente HTTP
  withInterceptorsFromDi,      // Configuración para interceptores HTTP
} from '@angular/common/http';

// Importaciones para el sistema de rutas
import { routes } from './app.routes';
import {
  provideRouter,               // Provider para el router
  withComponentInputBinding,   // Configuración para binding de inputs
  withInMemoryScrolling,       // Configuración para scroll en memoria
} from '@angular/router';

// Importaciones para animaciones y navegador
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideClientHydration } from '@angular/platform-browser';

// Importaciones para internacionalización
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// Importaciones para configuración de locale
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

// Registra el locale español para formateo de fechas, números, etc.
registerLocaleData(localeEs);

// Importaciones para iconos Tabler
import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';

// Importación para scrollbar personalizado
import { NgScrollbarModule } from 'ngx-scrollbar';

// Importaciones para Material Design y formularios
import { MaterialModule } from './material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/**
 * Factory function para crear el loader de traducciones
 * Configura el sistema de internacionalización para cargar archivos de traducción
 * 
 * @param http - Cliente HTTP para cargar archivos de traducción
 * @returns Instancia de TranslateHttpLoader configurada
 */
export function HttpLoaderFactory(http: HttpClient): any {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

/**
 * Configuración principal de la aplicación
 * Define todos los providers y configuraciones necesarias para el funcionamiento
 * de la aplicación Angular
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Configuración de locale español
    { provide: LOCALE_ID, useValue: 'es-ES' },
    
    // Configuración de zona de detección de cambios optimizada
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Configuración del sistema de rutas
    provideRouter(
      routes,  // Rutas definidas en app.routes.ts
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',  // Restaura posición de scroll al navegar
        anchorScrolling: 'enabled',            // Habilita scroll a anclas
      }),
      withComponentInputBinding()              // Habilita binding de inputs en rutas
    ),
    
    // Configuración del cliente HTTP con interceptores
    provideHttpClient(withInterceptorsFromDi()),
    
    // Configuración de animaciones asíncronas
    provideAnimationsAsync(),
    
    // Importación de módulos y providers adicionales
    importProvidersFrom(
      FormsModule,           // Formularios template-driven
      ReactiveFormsModule,   // Formularios reactivos
      MaterialModule,        // Componentes de Material Design
      
      // Configuración de iconos Tabler
      TablerIconsModule.pick(TablerIcons),
      
      // Configuración de scrollbar personalizado
      NgScrollbarModule,
      
      // Configuración del sistema de internacionalización
      TranslateModule.forRoot({
        defaultLanguage: 'es',  // Idioma por defecto
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,  // Factory para cargar traducciones
          deps: [HttpClient],             // Dependencias del factory
        },
      })
    ),
  ],
};
