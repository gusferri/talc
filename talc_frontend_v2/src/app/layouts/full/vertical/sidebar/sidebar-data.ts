import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
  },
  {
    displayName: 'Inicio',
    iconName: 'home',
    route: '/dashboard',
  },
  {
    displayName: 'Turnos',
    iconName: 'calendar',
    route: '/turnos',
  },
  {
    displayName: 'Pacientes',
    iconName: 'users',
    route: '/pacientes',
  },
  {
    displayName: 'Facturación',
    iconName: 'file-invoice',
  },
  {
    displayName: 'Administración',
    iconName: 'settings',
    route: '/administracion',
    roles: ['administrador', 'admin']
  },
];
