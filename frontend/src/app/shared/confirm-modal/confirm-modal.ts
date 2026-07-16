import { Component, ElementRef, ViewChild, effect, inject } from '@angular/core';

import { ConfirmModalService } from './confirm-modal.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    @if (confirmModalService.pedidoAtual(); as pedido) {
      <div
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
        aria-label="Confirmação necessária"
        (keydown)="aoTeclar($event)"
      >
        <div class="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
          <p class="text-sm text-[#1B1E27] mb-6">{{ pedido.mensagem }}</p>
          <div class="flex justify-end gap-3">
            <button
              #botaoCancelar
              type="button"
              (click)="confirmModalService.responder(false)"
              class="px-4 py-2 text-sm rounded-md border border-gray-300"
            >
              Cancelar
            </button>
            <button
              #botaoConfirmar
              type="button"
              (click)="confirmModalService.responder(true)"
              class="px-4 py-2 text-sm rounded-md bg-red-600 text-white"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmModalComponent {
  readonly confirmModalService = inject(ConfirmModalService);

  @ViewChild('botaoCancelar') private readonly botaoCancelar?: ElementRef<HTMLButtonElement>;
  @ViewChild('botaoConfirmar') private readonly botaoConfirmar?: ElementRef<HTMLButtonElement>;

  constructor() {
    effect(() => {
      if (this.confirmModalService.pedidoAtual()) {
        // Foca o botão "Cancelar" assim que o modal aparece — sem isso, o Tab
        // a partir do botão que abriu o modal segue o fluxo normal da página
        // por trás, podendo cair em outro botão "Excluir" de outra linha da
        // tabela. Usa queueMicrotask (não setTimeout): uma macrotask perde a
        // corrida para um Tab que o usuário já tenha disparado antes dela
        // rodar, já que eventos de teclado são despachados como tasks e só
        // entram na fila depois que todas as microtasks pendentes esvaziam —
        // uma microtask sempre roda antes da próxima tecla ser processada.
        queueMicrotask(() => this.botaoCancelar?.nativeElement.focus());
      }
    });
  }

  aoTeclar(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') {
      this.confirmModalService.responder(false);
      return;
    }
    if (evento.key !== 'Tab') {
      return;
    }
    const cancelar = this.botaoCancelar?.nativeElement;
    const confirmar = this.botaoConfirmar?.nativeElement;
    if (!cancelar || !confirmar) {
      return;
    }
    // Trap de foco: só existem esses dois botões dentro do modal, então o
    // Tab (e Shift+Tab) precisa ciclar só entre eles, nunca escapar pra
    // página por trás.
    if (evento.shiftKey && document.activeElement === cancelar) {
      evento.preventDefault();
      confirmar.focus();
    } else if (!evento.shiftKey && document.activeElement === confirmar) {
      evento.preventDefault();
      cancelar.focus();
    }
  }
}
