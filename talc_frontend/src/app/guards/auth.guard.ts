import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Chequear si el usuario está "logueado" en localStorage
  const isLoggedIn = !!localStorage.getItem('usuario');

  if (isLoggedIn) {
    return true; // Permitir el acceso
  } else {
    router.navigate(['/login']);
    return false; // Bloquear el acceso
  }
};
