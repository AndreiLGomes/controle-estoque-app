import { Component, OnInit, inject, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { EstadoCarregando } from '../../shared/estado-carregando/estado-carregando';
import { EstadoErro } from '../../shared/estado-erro/estado-erro';
import { ResumoDashboard } from './dashboard.model';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [BaseChartDirective, EstadoCarregando, EstadoErro],
  template: `
    <h1 class="text-2xl font-semibold mb-6">Dashboard</h1>

    @if (carregando()) {
      <app-estado-carregando />
    } @else if (erro()) {
      <app-estado-erro [mensagem]="erro()!" (tentarNovamente)="carregar()" />
    } @else {
      <div class="grid grid-cols-3 gap-4 mb-8">
        <div class="bg-white rounded-lg p-5">
          <p class="text-sm text-gray-600">Total de produtos</p>
          <p class="text-3xl font-semibold fonte-dados mt-1">{{ resumo()?.total_produtos }}</p>
        </div>
        <div class="bg-white rounded-lg p-5">
          <p class="text-sm text-gray-600">Itens em estoque</p>
          <p class="text-3xl font-semibold fonte-dados mt-1">{{ resumo()?.total_itens_estoque }}</p>
        </div>
        <div class="bg-white rounded-lg p-5">
          <p class="text-sm text-gray-600">Produtos com estoque baixo</p>
          <p class="text-3xl font-semibold fonte-dados mt-1 text-red-700">{{ resumo()?.produtos_baixo_estoque }}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white rounded-lg p-5">
          <h2 class="text-sm font-medium text-gray-700 mb-4">Movimentações — últimos 30 dias</h2>
          <div class="relative h-64">
            <canvas baseChart [data]="dadosMovimentacoes()" [type]="'line'"></canvas>
          </div>
        </div>
        <div class="bg-white rounded-lg p-5">
          <h2 class="text-sm font-medium text-gray-700 mb-4">Produtos por categoria</h2>
          <div class="relative h-64">
            <canvas baseChart [data]="dadosCategorias()" [type]="'bar'"></canvas>
          </div>
        </div>
      </div>
    }
  `,
})
export class DashboardPage implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly resumo = signal<ResumoDashboard | null>(null);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);

  readonly dadosMovimentacoes = signal<ChartConfiguration<'line'>['data']>({
    labels: [],
    datasets: [],
  });
  readonly dadosCategorias = signal<ChartConfiguration<'bar'>['data']>({
    labels: [],
    datasets: [],
  });

  ngOnInit(): void {
    this.carregar();
  }

  async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);
    try {
      const [resumo, movimentacoes, categorias] = await Promise.all([
        this.dashboardService.obterResumo(),
        this.dashboardService.obterMovimentacoes30Dias(),
        this.dashboardService.obterProdutosPorCategoria(),
      ]);
      this.resumo.set(resumo);
      this.dadosMovimentacoes.set({
        labels: movimentacoes.map((m) => m.data),
        datasets: [
          { data: movimentacoes.map((m) => m.entradas), label: 'Entradas', borderColor: '#16a34a' },
          { data: movimentacoes.map((m) => m.saidas), label: 'Saídas', borderColor: '#dc2626' },
        ],
      });
      this.dadosCategorias.set({
        labels: categorias.map((c) => c.categoria),
        datasets: [{ data: categorias.map((c) => c.total_produtos), label: 'Produtos', backgroundColor: '#463AE0' }],
      });
    } catch {
      this.erro.set('Não foi possível carregar os dados. Tente novamente em alguns instantes.');
    } finally {
      this.carregando.set(false);
    }
  }
}
