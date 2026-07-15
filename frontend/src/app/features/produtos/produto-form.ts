import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { HttpActivityService } from '../../core/http-activity.service';
import { CategoriaService } from '../categorias/categoria.service';
import { FornecedorService } from '../fornecedores/fornecedor.service';
import { ToastService } from '../../shared/toast/toast.service';
import { ProdutoService } from './produto.service';

@Component({
  selector: 'app-produto-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h1 class="text-2xl font-semibold mb-6">{{ produtoId === null ? 'Novo produto' : 'Editar produto' }}</h1>

    <form [formGroup]="formulario" (ngSubmit)="salvar()" class="bg-white rounded-lg p-6 max-w-xl flex flex-col gap-4">
      <div>
        <label class="block text-sm text-gray-600 mb-1">Nome</label>
        <input type="text" formControlName="nome" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        @if (formulario.controls.nome.invalid && formulario.controls.nome.touched) {
          <p class="text-xs text-red-600 mt-1">O nome é obrigatório.</p>
        }
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">Preço</label>
        <input type="number" step="0.01" formControlName="preco" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        @if (formulario.controls.preco.invalid && formulario.controls.preco.touched) {
          <p class="text-xs text-red-600 mt-1">O preço deve ser maior que zero.</p>
        }
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">Categoria</label>
        <select formControlName="categoria_id" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option [ngValue]="null" disabled>Selecione uma categoria</option>
          @for (categoria of categoriaService.dados(); track categoria.id) {
            <option [ngValue]="categoria.id">{{ categoria.nome }}</option>
          }
        </select>
        @if (formulario.controls.categoria_id.invalid && formulario.controls.categoria_id.touched) {
          <p class="text-xs text-red-600 mt-1">Selecione uma categoria.</p>
        }
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">Estoque mínimo</label>
        <input type="number" formControlName="estoque_minimo" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        @if (formulario.controls.estoque_minimo.invalid && formulario.controls.estoque_minimo.touched) {
          <p class="text-xs text-red-600 mt-1">O estoque mínimo não pode ser negativo.</p>
        }
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-2">Fornecedores</label>
        <div class="flex flex-col gap-2">
          @for (fornecedor of fornecedorService.dados(); track fornecedor.id) {
            <label class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                [checked]="fornecedoresSelecionados.has(fornecedor.id)"
                (change)="alternarFornecedor(fornecedor.id)"
              />
              {{ fornecedor.nome }}
            </label>
          }
        </div>
      </div>

      @if (produtoId === null) {
        <p class="text-xs text-gray-500">
          O estoque inicial deste produto começa em 0 — registre uma entrada na tela de movimentação depois de criá-lo.
        </p>
      }

      <div class="flex gap-3 pt-2">
        <button
          type="submit"
          [disabled]="formulario.invalid || atividade.emAndamento()"
          class="px-4 py-2 bg-[#463AE0] text-white text-sm rounded-md disabled:opacity-50"
        >
          {{ atividade.emAndamento() ? 'Salvando...' : 'Salvar' }}
        </button>
        <button type="button" (click)="router.navigate(['/produtos'])" class="px-4 py-2 text-sm rounded-md border border-gray-300">
          Cancelar
        </button>
      </div>
    </form>
  `,
})
export class ProdutoForm implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly produtoService = inject(ProdutoService);
  readonly categoriaService = inject(CategoriaService);
  readonly fornecedorService = inject(FornecedorService);
  private readonly toast = inject(ToastService);
  readonly atividade = inject(HttpActivityService);

  produtoId: number | null = null;
  readonly fornecedoresSelecionados = new Set<number>();

  readonly formulario = this.formBuilder.nonNullable.group({
    nome: ['', Validators.required],
    preco: [0, [Validators.required, Validators.min(0.01)]],
    categoria_id: [null as number | null, Validators.required],
    estoque_minimo: [10, [Validators.required, Validators.min(0)]],
  });

  async ngOnInit(): Promise<void> {
    await this.categoriaService.carregar();
    await this.fornecedorService.carregar();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.produtoId = Number(idParam);
      const produto = await this.produtoService.obterPorId(this.produtoId);
      this.formulario.patchValue({
        nome: produto.nome,
        preco: produto.preco,
        categoria_id: produto.categoria_id,
        estoque_minimo: produto.estoque_minimo,
      });
      for (const fornecedorId of produto.fornecedor_ids) {
        this.fornecedoresSelecionados.add(fornecedorId);
      }
    }
  }

  alternarFornecedor(fornecedorId: number): void {
    if (this.fornecedoresSelecionados.has(fornecedorId)) {
      this.fornecedoresSelecionados.delete(fornecedorId);
    } else {
      this.fornecedoresSelecionados.add(fornecedorId);
    }
  }

  async salvar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    const dto = {
      nome: valores.nome,
      preco: valores.preco,
      categoria_id: valores.categoria_id!,
      estoque_minimo: valores.estoque_minimo,
      fornecedor_ids: Array.from(this.fornecedoresSelecionados),
    };
    try {
      if (this.produtoId === null) {
        await this.produtoService.criar(dto);
        this.toast.sucesso('Produto salvo com sucesso.');
      } else {
        await this.produtoService.atualizar(this.produtoId, dto);
        this.toast.sucesso('Produto salvo com sucesso.');
      }
      this.router.navigate(['/produtos']);
    } catch (erro: any) {
      const mensagem = erro?.error?.detail ?? 'Não foi possível salvar o produto.';
      this.toast.erro(typeof mensagem === 'string' ? mensagem : 'Verifique os dados informados.');
    }
  }
}
