import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { EstadoCarregando } from '../../shared/estado-carregando/estado-carregando';
import { EstadoErro } from '../../shared/estado-erro/estado-erro';
import { Produto } from './produto.model';
import { Movimentacao, ProdutoService } from './produto.service';

@Component({
  selector: 'app-produto-historico',
  standalone: true,
  imports: [RouterLink, DatePipe, EstadoCarregando, EstadoErro],
  template: `
    <a routerLink="/produtos" class="text-sm text-[#463AE0] hover:underline">&larr; Voltar para produtos</a>

    @if (carregando()) {
      <app-estado-carregando />
    } @else if (erro()) {
      <app-estado-erro [mensagem]="erro()!" (tentarNovamente)="carregar()" />
    } @else {
      <h1 class="text-2xl font-semibold my-6">Histórico — {{ produto()?.nome }}</h1>
      <table class="w-full bg-white rounded-lg overflow-hidden">
        <thead class="bg-gray-50 text-left text-sm text-gray-600">
          <tr>
            <th class="px-4 py-3">Data</th>
            <th class="px-4 py-3">Tipo</th>
            <th class="px-4 py-3">Quantidade</th>
          </tr>
        </thead>
        <tbody>
          @for (movimentacao of movimentacoes(); track movimentacao.id) {
            <tr class="border-t border-gray-100 text-sm">
              <td class="px-4 py-3 fonte-dados">{{ movimentacao.data | date: 'dd/MM/yyyy HH:mm' }}</td>
              <td class="px-4 py-3">
                <span [class.text-green-700]="movimentacao.tipo === 'entrada'" [class.text-red-700]="movimentacao.tipo === 'saída'">
                  {{ movimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
                </span>
              </td>
              <td class="px-4 py-3 fonte-dados">{{ movimentacao.quantidade }}</td>
            </tr>
          } @empty {
            <tr>
              <td colspan="3" class="px-4 py-6 text-center text-sm text-gray-500">
                Nenhuma movimentação registrada para este produto ainda.
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class ProdutoHistorico implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly produtoService = inject(ProdutoService);

  private readonly produtoId = Number(this.route.snapshot.paramMap.get('id'));

  readonly produto = signal<Produto | null>(null);
  readonly movimentacoes = signal<Movimentacao[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    this.carregar();
  }

  async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);
    try {
      const [produto, movimentacoes] = await Promise.all([
        this.produtoService.obterPorId(this.produtoId),
        this.produtoService.obterHistorico(this.produtoId),
      ]);
      this.produto.set(produto);
      this.movimentacoes.set(movimentacoes);
    } catch {
      this.erro.set('Não foi possível carregar os dados. Tente novamente em alguns instantes.');
    } finally {
      this.carregando.set(false);
    }
  }
}
