import { Component, OnInit, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { HttpActivityService } from '../../core/http-activity.service';
import { GuardaExecucaoUnica } from '../../shared/guarda-execucao-unica';
import { ToastService } from '../../shared/toast/toast.service';
import { ProdutoService } from '../produtos/produto.service';
import { MovimentacaoService } from './movimentacao.service';

@Component({
  selector: 'app-movimentacao-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h1 class="text-2xl font-semibold mb-6">Registrar movimentação</h1>

    <form [formGroup]="formulario" (ngSubmit)="registrar()" class="bg-white rounded-lg p-6 max-w-md flex flex-col gap-4">
      <div>
        <label class="block text-sm text-gray-600 mb-1">Produto</label>
        <select formControlName="produtoId" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option [ngValue]="null" disabled>Selecione um produto</option>
          @for (produto of produtoService.dados(); track produto.id) {
            <option [ngValue]="produto.id">{{ produto.nome }} (estoque atual: {{ produto.quantidade_estoque }})</option>
          }
        </select>
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-2">Tipo</label>
        <div class="flex gap-4 text-sm">
          <label class="flex items-center gap-2">
            <input type="radio" formControlName="tipo" value="entrada" /> Entrada
          </label>
          <label class="flex items-center gap-2">
            <input type="radio" formControlName="tipo" value="saída" /> Saída
          </label>
        </div>
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">Quantidade</label>
        <input type="number" formControlName="quantidade" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        @if (formulario.controls.quantidade.invalid && formulario.controls.quantidade.touched) {
          <p class="text-xs text-red-600 mt-1">A quantidade deve ser maior que zero.</p>
        }
        @if (excedeEstoqueDisponivel()) {
          <p class="text-xs text-red-600 mt-1">
            Estoque disponível: {{ produtoSelecionado()?.quantidade_estoque }}. Não é possível registrar uma saída maior que isso.
          </p>
        }
      </div>

      <div class="flex gap-3 pt-2">
        <button
          type="submit"
          [disabled]="formulario.invalid || excedeEstoqueDisponivel() || atividade.emAndamento()"
          class="px-4 py-2 bg-[#463AE0] text-white text-sm rounded-md disabled:opacity-50"
        >
          {{ atividade.emAndamento() ? 'Registrando...' : 'Registrar movimentação' }}
        </button>
        <button type="button" (click)="router.navigate(['/produtos'])" class="px-4 py-2 text-sm rounded-md border border-gray-300">
          Cancelar
        </button>
      </div>
    </form>
  `,
})
export class MovimentacaoForm implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  readonly router = inject(Router);
  readonly produtoService = inject(ProdutoService);
  private readonly movimentacaoService = inject(MovimentacaoService);
  private readonly toast = inject(ToastService);
  readonly atividade = inject(HttpActivityService);

  readonly formulario = this.formBuilder.nonNullable.group({
    produtoId: [null as number | null, Validators.required],
    tipo: ['entrada' as 'entrada' | 'saída', Validators.required],
    quantidade: [1, [Validators.required, Validators.min(1)]],
  });

  private readonly guardaRegistrar = new GuardaExecucaoUnica();

  // FormGroup usa RxJS (valueChanges), não signals — um computed() que lê
  // this.formulario.controls.x.value diretamente não tem nenhuma dependência
  // rastreável e nunca recalcula. toSignal cria uma ponte reativa de verdade:
  // os computeds abaixo leem essa signal, não o formulário direto.
  private readonly valoresFormulario = toSignal(this.formulario.valueChanges, {
    initialValue: this.formulario.getRawValue(),
  });

  readonly produtoSelecionado = computed(() => {
    const id = this.valoresFormulario().produtoId;
    return this.produtoService.dados().find((produto) => produto.id === id) ?? null;
  });

  readonly excedeEstoqueDisponivel = computed(() => {
    const produto = this.produtoSelecionado();
    const valores = this.valoresFormulario();
    if (!produto || valores.tipo !== 'saída') {
      return false;
    }
    // valueChanges é tipado como Partial<...> pelo Angular (controles podem
    // ser desabilitados), embora aqui nenhum controle nunca seja desabilitado
    // — o ?? 0 só satisfaz o TypeScript estrito, sem afetar o comportamento.
    return (valores.quantidade ?? 0) > produto.quantidade_estoque;
  });

  ngOnInit(): void {
    this.produtoService.carregar();
  }

  async registrar(): Promise<void> {
    if (this.formulario.invalid || this.excedeEstoqueDisponivel()) {
      this.formulario.markAllAsTouched();
      return;
    }
    await this.guardaRegistrar.executar(async () => {
      const valores = this.formulario.getRawValue();
      try {
        await this.movimentacaoService.registrar({
          produto_id: valores.produtoId!,
          tipo: valores.tipo,
          quantidade: valores.quantidade,
        });
        this.toast.sucesso('Movimentação registrada com sucesso.');
        this.router.navigate(['/produtos']);
      } catch (erro: any) {
        const mensagem = erro?.error?.detail ?? 'Não foi possível registrar a movimentação.';
        this.toast.erro(typeof mensagem === 'string' ? mensagem : 'Verifique os dados informados.');
      }
    });
  }
}
