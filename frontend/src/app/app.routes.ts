import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'categorias',
    loadComponent: () =>
      import('./features/categorias/categorias-page').then((m) => m.CategoriasPage),
  },
];
