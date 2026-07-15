import { Component, inject } from '@angular/core';

import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="px-4 py-3 rounded-md shadow-md text-sm text-white"
          [class.bg-green-600]="toast.tipo === 'sucesso'"
          [class.bg-red-600]="toast.tipo === 'erro'"
        >
          {{ toast.mensagem }}
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
