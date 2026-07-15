import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MovimentacaoPorDia, ProdutosPorCategoria, ResumoDashboard } from './dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  obterResumo(): Promise<ResumoDashboard> {
    return firstValueFrom(this.http.get<ResumoDashboard>(`${this.baseUrl}/resumo`));
  }

  obterMovimentacoes30Dias(): Promise<MovimentacaoPorDia[]> {
    return firstValueFrom(
      this.http.get<MovimentacaoPorDia[]>(`${this.baseUrl}/movimentacoes-30-dias`),
    );
  }

  obterProdutosPorCategoria(): Promise<ProdutosPorCategoria[]> {
    return firstValueFrom(
      this.http.get<ProdutosPorCategoria[]>(`${this.baseUrl}/produtos-por-categoria`),
    );
  }
}
