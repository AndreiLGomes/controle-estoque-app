import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HttpActivityService } from '../../core/http-activity.service';
import { ConfirmModalService } from '../../shared/confirm-modal/confirm-modal.service';
import { EstadoCarregando } from '../../shared/estado-carregando/estado-carregando';
import { EstadoErro } from '../../shared/estado-erro/estado-erro';
import { GuardaExecucaoUnica } from '../../shared/guarda-execucao-unica';
import { ToastService } from '../../shared/toast/toast.service';
import { FornecedorService } from './fornecedor.service';

@Component({
  selector: 'app-fornecedores-page',
  standalone: true,
  imports: [FormsModule, EstadoCarregando, EstadoErro],
  template: `
    <h1 class="text-2xl font-semibold mb-6">Fornecedores</h1>

    <form (ngSubmit)="salvar()" class="bg-white rounded-lg p-4 mb-6 flex gap-3 items-end max-w-xl">
      <div class="flex-1">
        <label class="block text-sm text-gray-600 mb-1">Nome</label>
        <input
          type="text"
          [(ngModel)]="nomeFormulario"
          name="nome"
          [disabled]="atividade.emAndamento()"
          class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:opacity-50"
        />
      </div>
      <div class="flex-1">
        <label class="block text-sm text-gray-600 mb-1">Contato</label>
        <input
          type="text"
          [(ngModel)]="contatoFormulario"
          name="contato"
          [disabled]="atividade.emAndamento()"
          class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        [disabled]="atividade.emAndamento() || !nomeFormulario().trim() || !contatoFormulario().trim()"
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

    @if (fornecedorService.carregando()) {
      <app-estado-carregando />
    } @else if (fornecedorService.erro()) {
      <app-estado-erro [mensagem]="fornecedorService.erro()!" (tentarNovamente)="fornecedorService.carregar()" />
    } @else {
      <table class="w-full bg-white rounded-lg overflow-hidden">
        <thead class="bg-gray-50 text-left text-sm text-gray-600">
          <tr>
            <th class="px-4 py-3">Nome</th>
            <th class="px-4 py-3">Contato</th>
            <th class="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          @for (fornecedor of fornecedorService.dados(); track fornecedor.id) {
            <tr class="border-t border-gray-100 text-sm">
              <td class="px-4 py-3">{{ fornecedor.nome }}</td>
              <td class="px-4 py-3 fonte-dados">{{ fornecedor.contato }}</td>
              <td class="px-4 py-3 text-right">
                <button (click)="editar(fornecedor)" [disabled]="atividade.emAndamento()" class="text-[#463AE0] mr-3 disabled:opacity-50">Editar</button>
                <button (click)="excluir(fornecedor)" [disabled]="atividade.emAndamento()" class="text-red-600 disabled:opacity-50">
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
export class FornecedoresPage implements OnInit {
  readonly fornecedorService = inject(FornecedorService);
  readonly atividade = inject(HttpActivityService);
  private readonly toast = inject(ToastService);
  private readonly confirmModal = inject(ConfirmModalService);

  readonly nomeFormulario = signal('');
  readonly contatoFormulario = signal('');
  readonly idEmEdicao = signal<number | null>(null);
  private readonly guardaSalvar = new GuardaExecucaoUnica();

  ngOnInit(): void {
    this.fornecedorService.carregar();
  }

  editar(fornecedor: { id: number; nome: string; contato: string }): void {
    this.idEmEdicao.set(fornecedor.id);
    this.nomeFormulario.set(fornecedor.nome);
    this.contatoFormulario.set(fornecedor.contato);
  }

  cancelarEdicao(): void {
    this.idEmEdicao.set(null);
    this.nomeFormulario.set('');
    this.contatoFormulario.set('');
  }

  async salvar(): Promise<void> {
    const nome = this.nomeFormulario().trim();
    const contato = this.contatoFormulario().trim();
    if (!nome || !contato) {
      return;
    }
    await this.guardaSalvar.executar(async () => {
      try {
        if (this.idEmEdicao() === null) {
          await this.fornecedorService.criar(nome, contato);
          this.toast.sucesso('Fornecedor criado com sucesso.');
        } else {
          await this.fornecedorService.atualizar(this.idEmEdicao()!, nome, contato);
          this.toast.sucesso('Fornecedor atualizado com sucesso.');
        }
        this.cancelarEdicao();
        await this.fornecedorService.carregar();
      } catch {
        this.toast.erro('Não foi possível salvar o fornecedor. Tente novamente.');
      }
    });
  }

  async excluir(fornecedor: { id: number; nome: string }): Promise<void> {
    const confirmado = await this.confirmModal.confirmar(
      `Tem certeza que deseja excluir "${fornecedor.nome}"? Esta ação não pode ser desfeita.`,
    );
    if (!confirmado) {
      return;
    }
    try {
      await this.fornecedorService.excluir(fornecedor.id);
      this.toast.sucesso('Fornecedor excluído com sucesso.');
      await this.fornecedorService.carregar();
    } catch {
      this.toast.erro('Não foi possível excluir o fornecedor.');
    }
  }
}
