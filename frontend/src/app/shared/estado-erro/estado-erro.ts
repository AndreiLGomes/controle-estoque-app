import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-estado-erro',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-16 text-center gap-4">
      <p class="text-sm text-red-700">{{ mensagem }}</p>
      <button
        type="button"
        (click)="tentarNovamente.emit()"
        class="px-4 py-2 bg-[#463AE0] text-white text-sm rounded-md hover:opacity-90"
      >
        Tentar novamente
      </button>
    </div>
  `,
})
export class EstadoErro {
  @Input() mensagem =
    'Não foi possível carregar os dados. Tente novamente em alguns instantes.';
  @Output() tentarNovamente = new EventEmitter<void>();
}
