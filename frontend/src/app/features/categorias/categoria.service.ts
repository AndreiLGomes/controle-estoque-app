import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Categoria } from './categoria.model';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/categorias`;

  readonly dados = signal<Categoria[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);
    try {
      const categorias = await firstValueFrom(this.http.get<Categoria[]>(this.baseUrl));
      this.dados.set(categorias);
    } catch {
      this.erro.set('Não foi possível carregar os dados. Tente novamente em alguns instantes.');
    } finally {
      this.carregando.set(false);
    }
  }

  criar(nome: string): Promise<Categoria> {
    return firstValueFrom(this.http.post<Categoria>(this.baseUrl, { nome }));
  }

  atualizar(id: number, nome: string): Promise<Categoria> {
    return firstValueFrom(this.http.put<Categoria>(`${this.baseUrl}/${id}`, { nome }));
  }

  excluir(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }
}
