import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen">
      <header class="bg-white border-b border-gray-200 px-6 py-4">
        <nav class="flex gap-6 items-center max-w-6xl mx-auto">
          <span class="font-semibold text-lg" style="font-family: 'Space Grotesk', sans-serif;">
            Controle de Estoque
          </span>
          <a routerLink="/" routerLinkActive="text-[#463AE0] font-medium" [routerLinkActiveOptions]="{exact: true}" class="text-sm">Dashboard</a>
          <a routerLink="/produtos" routerLinkActive="text-[#463AE0] font-medium" class="text-sm">Produtos</a>
          <a routerLink="/movimentacoes/nova" routerLinkActive="text-[#463AE0] font-medium" class="text-sm">Nova Movimentação</a>
          <a routerLink="/categorias" routerLinkActive="text-[#463AE0] font-medium" class="text-sm">Categorias</a>
          <a routerLink="/fornecedores" routerLinkActive="text-[#463AE0] font-medium" class="text-sm">Fornecedores</a>
        </nav>
      </header>
      <main class="max-w-6xl mx-auto px-6 py-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {}
