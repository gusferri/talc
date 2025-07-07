import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Chequear si el usuario está "logueado" en localStorage
  const usuario = localStorage.getItem('usuario');
  const username = localStorage.getItem('username');
  const nombreCompleto = localStorage.getItem('nombreCompleto');

  console.log('AuthGuard - Verificando autenticación:', {
    usuario,
    username,
    nombreCompleto,
    url: state.url
  });

  // Permitir acceso si existe cualquier valor en localStorage relacionado con autenticación
  const isLoggedIn = usuario || username || nombreCompleto;

  if (isLoggedIn) {
    console.log('AuthGuard - Usuario autenticado, permitiendo acceso');
    return true; // Permitir el acceso
  } else {
    console.log('AuthGuard - Usuario no autenticado, redirigiendo a login');
    router.navigate(['/authentication/login']);
    return false; // Bloquear el acceso
  }
}; 