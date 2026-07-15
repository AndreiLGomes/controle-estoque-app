import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-estado-carregando',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div class="w-8 h-8 border-4 border-gray-200 border-t-[#463AE0] rounded-full animate-spin"></div>
      <p class="text-sm text-gray-600">{{ mensagem }}</p>
    </div>
  `,
})
export class EstadoCarregando {
  @Input() mensagem =
    'Carregando dados... pode levar até 1 minuto na primeira vez (servidor gratuito iniciando).';
}
