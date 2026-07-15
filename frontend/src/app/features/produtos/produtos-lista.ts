import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HttpActivityService } from '../../core/http-activity.service';
import { CategoriaService } from '../categorias/categoria.service';
import { ConfirmModalService } from '../../shared/confirm-modal/confirm-modal.service';
import { EstadoCarregando } from '../../shared/estado-carregando/estado-carregando';
import { EstadoErro } from '../../shared/estado-erro/estado-erro';
import { ToastService } from '../../shared/toast/toast.service';
import { Produto, ProdutoFiltros } from './produto.model';
import { ProdutoService } from './produto.service';

type ColunaOrdenavel = 'nome' | 'preco' | 'quantidade_estoque';

@Component({
  selector: 'app-produtos-lista',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe, EstadoCarregando, EstadoErro],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">Produtos</h1>
      <a routerLink="/produtos/novo" class="px-4 py-2 bg-[#463AE0] text-white text-sm rounded-md">
        Novo produto
      </a>
    </div>

    <div class="bg-white rounded-lg p-4 mb-6 flex gap-4 items-end">
      <div>
        <label class="block text-sm text-gray-600 mb-1">Categoria</label>
        <select
          [(ngModel)]="categoriaSelecionada"
          (ngModelChange)="recarregar()"
          [disabled]="atividade.emAndamento()"
          class="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option [ngValue]="undefined">Todas</option>
          @for (categoria of categoriaService.dados(); track categoria.id) {
            <option [ngValue]="categoria.id">{{ categoria.nome }}</option>
          }
        </select>
      </div>
      <div class="flex-1">
        <label class="block text-sm text-gray-600 mb-1">Buscar por nome</label>
        <div class="flex gap-2">
          <input
            type="text"
            [(ngModel)]="busca"
            (keyup.enter)="recarregar()"
            [disabled]="atividade.emAndamento()"
            placeholder="Ex: mouse"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:opacity-50"
          />
          <button
            type="button"
            (click)="recarregar()"
            [disabled]="atividade.emAndamento()"
            class="px-4 py-2 text-sm rounded-md border border-gray-300 whitespace-nowrap disabled:opacity-50"
          >
            Buscar
          </button>
        </div>
      </div>
    </div>

    @if (produtoService.carregando()) {
      <app-estado-carregando />
    } @else if (produtoService.erro()) {
      <app-estado-erro [mensagem]="produtoService.erro()!" (tentarNovamente)="recarregar()" />
    } @else {
      <table class="w-full bg-white rounded-lg overflow-hidden">
        <thead class="bg-gray-50 text-left text-sm text-gray-600">
          <tr>
            <th
              class="px-4 py-3 cursor-pointer"
              [class.pointer-events-none]="atividade.emAndamento()"
              [class.opacity-50]="atividade.emAndamento()"
              (click)="ordenarPor('nome')"
            >
              Nome
            </th>
            <th class="px-4 py-3">Categoria</th>
            <th
              class="px-4 py-3 cursor-pointer"
              [class.pointer-events-none]="atividade.emAndamento()"
              [class.opacity-50]="atividade.emAndamento()"
              (click)="ordenarPor('preco')"
            >
              Preço
            </th>
            <th
              class="px-4 py-3 cursor-pointer"
              [class.pointer-events-none]="atividade.emAndamento()"
              [class.opacity-50]="atividade.emAndamento()"
              (click)="ordenarPor('quantidade_estoque')"
            >
              Estoque
            </th>
            <th class="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          @for (produto of produtoService.dados(); track produto.id) {
            <tr
              class="border-t border-gray-100 text-sm"
              [class.bg-red-50]="produto.quantidade_estoque < produto.estoque_minimo"
            >
              <td class="px-4 py-3">
                <a [routerLink]="['/produtos', produto.id, 'historico']" class="text-[#463AE0] hover:underline">
                  {{ produto.nome }}
                </a>
              </td>
              <td class="px-4 py-3">{{ nomeCategoria(produto.categoria_id) }}</td>
              <td class="px-4 py-3 fonte-dados">{{ produto.preco | number: '1.2-2' }}</td>
              <td class="px-4 py-3 fonte-dados">
                {{ produto.quantidade_estoque }}
                @if (produto.quantidade_estoque < produto.estoque_minimo) {
                  <span class="ml-2 text-xs text-red-700 font-medium">estoque baixo</span>
                }
              </td>
              <td class="px-4 py-3 text-right">
                <a [routerLink]="['/produtos', produto.id, 'editar']" class="text-[#463AE0] mr-3">Editar</a>
                <button (click)="excluir(produto)" [disabled]="atividade.emAndamento()" class="text-red-600 disabled:opacity-50">
                  {{ atividade.emAndamento() ? 'Excluindo...' : 'Excluir' }}
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class ProdutosLista implements OnInit {
  readonly produtoService = inject(ProdutoService);
  readonly categoriaService = inject(CategoriaService);
  readonly atividade = inject(HttpActivityService);
  private readonly toast = inject(ToastService);
  private readonly confirmModal = inject(ConfirmModalService);

  categoriaSelecionada: number | undefined = undefined;
  busca = '';
  private ordenacaoAtual: ColunaOrdenavel | undefined = undefined;

  private readonly categoriasPorId = computed(() => {
    const mapa = new Map<number, string>();
    for (const categoria of this.categoriaService.dados()) {
      mapa.set(categoria.id, categoria.nome);
    }
    return mapa;
  });

  ngOnInit(): void {
    this.categoriaService.carregar();
    this.recarregar();
  }

  nomeCategoria(categoriaId: number): string {
    return this.categoriasPorId().get(categoriaId) ?? '—';
  }

  recarregar(): void {
    const filtros: ProdutoFiltros = {
      categoriaId: this.categoriaSelecionada,
      busca: this.busca || undefined,
      ordenarPor: this.ordenacaoAtual,
    };
    this.produtoService.carregar(filtros);
  }

  ordenarPor(coluna: ColunaOrdenavel): void {
    this.ordenacaoAtual = coluna;
    this.recarregar();
  }

  async excluir(produto: Produto): Promise<void> {
    const confirmado = await this.confirmModal.confirmar(
      `Tem certeza que deseja excluir "${produto.nome}"? Esta ação não pode ser desfeita.`,
    );
    if (!confirmado) {
      return;
    }
    try {
      await this.produtoService.excluir(produto.id);
      this.toast.sucesso('Produto excluído com sucesso.');
      this.recarregar();
    } catch (erro: any) {
      const mensagem = erro?.error?.detail ?? 'Não foi possível excluir o produto.';
      this.toast.erro(mensagem);
    }
  }
}
