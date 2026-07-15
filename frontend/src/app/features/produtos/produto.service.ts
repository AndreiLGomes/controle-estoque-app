import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Produto, ProdutoEntrada, ProdutoFiltros } from './produto.model';

export interface Movimentacao {
  id: number;
  produto_id: number;
  tipo: 'entrada' | 'saída';
  quantidade: number;
  data: string;
}

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/produtos`;

  readonly dados = signal<Produto[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  async carregar(filtros?: ProdutoFiltros): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);
    try {
      let params = new HttpParams();
      if (filtros?.categoriaId) {
        params = params.set('categoria_id', filtros.categoriaId);
      }
      if (filtros?.busca) {
        params = params.set('busca', filtros.busca);
      }
      if (filtros?.ordenarPor) {
        params = params.set('ordenar_por', filtros.ordenarPor);
      }
      const produtos = await firstValueFrom(
        this.http.get<Produto[]>(this.baseUrl, { params }),
      );
      this.dados.set(produtos);
    } catch {
      this.erro.set('Não foi possível carregar os dados. Tente novamente em alguns instantes.');
    } finally {
      this.carregando.set(false);
    }
  }

  async carregarBaixoEstoque(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);
    try {
      const produtos = await firstValueFrom(
        this.http.get<Produto[]>(`${this.baseUrl}/baixo-estoque`),
      );
      this.dados.set(produtos);
    } catch {
      this.erro.set('Não foi possível carregar os dados. Tente novamente em alguns instantes.');
    } finally {
      this.carregando.set(false);
    }
  }

  obterPorId(id: number): Promise<Produto> {
    return firstValueFrom(this.http.get<Produto>(`${this.baseUrl}/${id}`));
  }

  criar(dto: ProdutoEntrada): Promise<Produto> {
    return firstValueFrom(this.http.post<Produto>(this.baseUrl, dto));
  }

  atualizar(id: number, dto: ProdutoEntrada): Promise<Produto> {
    return firstValueFrom(this.http.put<Produto>(`${this.baseUrl}/${id}`, dto));
  }

  excluir(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }

  obterHistorico(id: number): Promise<Movimentacao[]> {
    return firstValueFrom(
      this.http.get<Movimentacao[]>(`${this.baseUrl}/${id}/movimentacoes`),
    );
  }
}
