import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Movimentacao } from '../produtos/produto.service';

export interface MovimentacaoEntrada {
  produto_id: number;
  tipo: 'entrada' | 'saída';
  quantidade: number;
}

@Injectable({ providedIn: 'root' })
export class MovimentacaoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/movimentacoes`;

  registrar(dto: MovimentacaoEntrada): Promise<Movimentacao> {
    return firstValueFrom(this.http.post<Movimentacao>(this.baseUrl, dto));
  }
}
