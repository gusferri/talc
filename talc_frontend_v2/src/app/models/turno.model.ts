/**
 * Modelo Turno - Interfaz que define la estructura de datos para un turno/cita médica
 * 
 * Esta interfaz representa la estructura de datos que se utiliza en toda la aplicación
 * para manejar información de turnos médicos. Define los campos esenciales que debe
 * tener un turno para ser procesado correctamente por el sistema.
 * 
 * Propósito:
 * - Proporcionar tipado fuerte para operaciones con turnos
 * - Garantizar consistencia en la estructura de datos
 * - Facilitar el desarrollo y mantenimiento del código
 * - Mejorar la experiencia de desarrollo con autocompletado
 * 
 * Utilización:
 * - En servicios para definir tipos de retorno
 * - En componentes para tipar variables y parámetros
 * - En templates para validación de datos
 * - En operaciones CRUD de turnos
 */
export interface Turno {
    /** ID único del turno en la base de datos */
    ID: number;
    
    /** Nombre completo del paciente asignado al turno */
    Paciente: string;
    
    /** Nombre completo del profesional que atenderá el turno */
    Profesional: string;
    
    /** Especialidad médica del turno (ej: Psicología, Psiquiatría, etc.) */
    Especialidad: string;
    
    /** Fecha del turno en formato YYYY-MM-DD */
    Fecha: string;
    
    /** Hora del turno en formato HH:MM */
    Hora: string;
    
    /** Estado actual del turno (ej: Agendado, Confirmado, Cancelado, Completado) */
    Estado: string;
} 