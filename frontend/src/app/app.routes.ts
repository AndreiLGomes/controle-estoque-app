import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'categorias',
    loadComponent: () =>
      import('./features/categorias/categorias-page').then((m) => m.CategoriasPage),
  },
  {
    path: 'fornecedores',
    loadComponent: () =>
      import('./features/fornecedores/fornecedores-page').then((m) => m.FornecedoresPage),
  },
  {
    path: 'produtos',
    loadComponent: () =>
      import('./features/produtos/produtos-lista').then((m) => m.ProdutosLista),
  },
  {
    path: 'produtos/novo',
    loadComponent: () =>
      import('./features/produtos/produto-form').then((m) => m.ProdutoForm),
  },
  {
    path: 'produtos/:id/editar',
    loadComponent: () =>
      import('./features/produtos/produto-form').then((m) => m.ProdutoForm),
  },
];
