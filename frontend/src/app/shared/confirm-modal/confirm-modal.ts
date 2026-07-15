import { Component, inject } from '@angular/core';

import { ConfirmModalService } from './confirm-modal.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    @if (confirmModalService.pedidoAtual(); as pedido) {
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
          <p class="text-sm text-[#1B1E27] mb-6">{{ pedido.mensagem }}</p>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              (click)="confirmModalService.responder(false)"
              class="px-4 py-2 text-sm rounded-md border border-gray-300"
            >
              Cancelar
            </button>
            <button
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
}
