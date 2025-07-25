/**
 * Punto de entrada principal de la aplicación TALC
 * 
 * Este archivo es el punto de inicio de la aplicación Angular. Se ejecuta cuando
 * el navegador carga la aplicación y es responsable de inicializar el framework
 * Angular y cargar el componente raíz de la aplicación.
 * 
 * Funciones principales:
 * - Importar las configuraciones de la aplicación
 * - Inicializar el framework Angular
 * - Cargar el componente raíz (AppComponent)
 * - Manejar errores de inicialización
 * 
 * Flujo de ejecución:
 * 1. Se importan las configuraciones de la aplicación
 * 2. Se importa el componente raíz
 * 3. Se inicia la aplicación con bootstrapApplication
 * 4. Se maneja cualquier error que pueda ocurrir durante la inicialización
 */

// Importación de la función para iniciar la aplicación Angular
import { bootstrapApplication } from '@angular/platform-browser';
// Importación de las configuraciones de la aplicación (rutas, providers, etc.)
import { appConfig } from './app/app.config';
// Importación del componente raíz de la aplicación
import { AppComponent } from './app/app.component';

/**
 * Inicia la aplicación Angular
 * 
 * bootstrapApplication es la función moderna de Angular para iniciar aplicaciones
 * standalone. Recibe el componente raíz y las configuraciones como parámetros.
 * 
 * @param AppComponent - Componente raíz que se renderizará primero
 * @param appConfig - Configuraciones de la aplicación (rutas, providers, etc.)
 * @returns Promise que se resuelve cuando la aplicación se inicia correctamente
 */
bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)  // Maneja y muestra errores de inicialización en la consola
);
