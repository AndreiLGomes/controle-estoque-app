import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Fornecedor } from './fornecedor.model';

@Injectable({ providedIn: 'root' })
export class FornecedorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/fornecedores`;

  readonly dados = signal<Fornecedor[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);
    try {
      const fornecedores = await firstValueFrom(this.http.get<Fornecedor[]>(this.baseUrl));
      this.dados.set(fornecedores);
    } catch {
      this.erro.set('Não foi possível carregar os dados. Tente novamente em alguns instantes.');
    } finally {
      this.carregando.set(false);
    }
  }

  criar(nome: string, contato: string): Promise<Fornecedor> {
    return firstValueFrom(this.http.post<Fornecedor>(this.baseUrl, { nome, contato }));
  }

  atualizar(id: number, nome: string, contato: string): Promise<Fornecedor> {
    return firstValueFrom(
      this.http.put<Fornecedor>(`${this.baseUrl}/${id}`, { nome, contato }),
    );
  }

  excluir(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }
}
