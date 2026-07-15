import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HttpActivityService } from '../../core/http-activity.service';
import { ConfirmModalService } from '../../shared/confirm-modal/confirm-modal.service';
import { EstadoCarregando } from '../../shared/estado-carregando/estado-carregando';
import { EstadoErro } from '../../shared/estado-erro/estado-erro';
import { ToastService } from '../../shared/toast/toast.service';
import { CategoriaService } from './categoria.service';

@Component({
  selector: 'app-categorias-page',
  standalone: true,
  imports: [FormsModule, EstadoCarregando, EstadoErro],
  template: `
    <h1 class="text-2xl font-semibold mb-6">Categorias</h1>

    <form (ngSubmit)="salvar()" class="bg-white rounded-lg p-4 mb-6 flex gap-3 items-end max-w-md">
      <div class="flex-1">
        <label class="block text-sm text-gray-600 mb-1">Nome</label>
        <input
          type="text"
          [(ngModel)]="nomeFormulario"
          name="nome"
          class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        [disabled]="atividade.emAndamento() || !nomeFormulario().trim()"
        class="px-4 py-2 bg-[#463AE0] text-white text-sm rounded-md disabled:opacity-50"
      >
        {{ atividade.emAndamento() ? 'Salvando...' : (idEmEdicao() === null ? 'Adicionar' : 'Salvar') }}
      </button>
      @if (idEmEdicao() !== null) {
        <button type="button" (click)="cancelarEdicao()" class="px-4 py-2 text-sm rounded-md border border-gray-300">
          Cancelar
        </button>
      }
    </form>

    @if (categoriaService.carregando()) {
      <app-estado-carregando />
    } @else if (categoriaService.erro()) {
      <app-estado-erro [mensagem]="categoriaService.erro()!" (tentarNovamente)="categoriaService.carregar()" />
    } @else {
      <table class="w-full bg-white rounded-lg overflow-hidden">
        <thead class="bg-gray-50 text-left text-sm text-gray-600">
          <tr>
            <th class="px-4 py-3">Nome</th>
            <th class="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          @for (categoria of categoriaService.dados(); track categoria.id) {
            <tr class="border-t border-gray-100 text-sm">
              <td class="px-4 py-3">{{ categoria.nome }}</td>
              <td class="px-4 py-3 text-right">
                <button (click)="editar(categoria)" [disabled]="atividade.emAndamento()" class="text-[#463AE0] mr-3 disabled:opacity-50">Editar</button>
                <button (click)="excluir(categoria)" [disabled]="atividade.emAndamento()" class="text-red-600 disabled:opacity-50">
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
export class CategoriasPage implements OnInit {
  readonly categoriaService = inject(CategoriaService);
  private readonly toast = inject(ToastService);
  private readonly confirmModal = inject(ConfirmModalService);
  readonly atividade = inject(HttpActivityService);

  readonly nomeFormulario = signal('');
  readonly idEmEdicao = signal<number | null>(null);

  ngOnInit(): void {
    this.categoriaService.carregar();
  }

  editar(categoria: { id: number; nome: string }): void {
    this.idEmEdicao.set(categoria.id);
    this.nomeFormulario.set(categoria.nome);
  }

  cancelarEdicao(): void {
    this.idEmEdicao.set(null);
    this.nomeFormulario.set('');
  }

  async salvar(): Promise<void> {
    const nome = this.nomeFormulario().trim();
    if (!nome) {
      return;
    }
    try {
      if (this.idEmEdicao() === null) {
        await this.categoriaService.criar(nome);
        this.toast.sucesso('Categoria criada com sucesso.');
      } else {
        await this.categoriaService.atualizar(this.idEmEdicao()!, nome);
        this.toast.sucesso('Categoria atualizada com sucesso.');
      }
      this.cancelarEdicao();
      await this.categoriaService.carregar();
    } catch {
      this.toast.erro('Não foi possível salvar a categoria. Tente novamente.');
    }
  }

  async excluir(categoria: { id: number; nome: string }): Promise<void> {
    const confirmado = await this.confirmModal.confirmar(
      `Tem certeza que deseja excluir "${categoria.nome}"? Esta ação não pode ser desfeita.`,
    );
    if (!confirmado) {
      return;
    }
    try {
      await this.categoriaService.excluir(categoria.id);
      this.toast.sucesso('Categoria excluída com sucesso.');
      await this.categoriaService.carregar();
    } catch (erro: any) {
      const mensagem = erro?.error?.detail ?? 'Não foi possível excluir a categoria.';
      this.toast.erro(mensagem);
    }
  }
}
