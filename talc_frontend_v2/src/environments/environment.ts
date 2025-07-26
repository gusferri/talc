/**
 * Configuración del entorno de desarrollo
 * 
 * Este archivo contiene las configuraciones específicas para el entorno de desarrollo
 * de la aplicación TALC. Define variables que pueden cambiar según el entorno
 * donde se ejecute la aplicación (desarrollo, producción, testing).
 * 
 * Propósito:
 * - Centralizar configuraciones del entorno
 * - Facilitar cambios entre diferentes entornos
 * - Mantener separadas las configuraciones de desarrollo y producción
 * - Proporcionar URLs y configuraciones específicas del entorno
 * 
 * Variables de configuración:
 * - production: Flag que indica si es entorno de producción
 * - apiBaseUrl: URL base del backend para todas las peticiones HTTP
 * 
 * Nota: En producción, este archivo se reemplaza por environment.prod.ts
 * con configuraciones específicas para el entorno de producción.
 */
export const environment = {
  /** Flag que indica si la aplicación está en modo producción */
  production: false,
  
  /** URL base del backend para todas las peticiones HTTP */
  //apiBaseUrl: 'http://192.168.2.41:8000'
  apiBaseUrl: 'http://localhost:8000'
}; 