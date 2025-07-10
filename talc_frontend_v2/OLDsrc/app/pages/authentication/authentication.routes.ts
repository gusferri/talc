import { Routes } from '@angular/router';

import { AppErrorComponent } from './error/error.component';
import { LoginComponent } from './login/login.component';

export const AuthenticationRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'error',
        component: AppErrorComponent,
      },
      {
        path: 'login',
        component: LoginComponent,
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ],
  },
];
