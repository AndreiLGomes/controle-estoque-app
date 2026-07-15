import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HttpActivityService {
  private readonly contagem = signal(0);
  readonly emAndamento = computed(() => this.contagem() > 0);

  iniciar(): void {
    this.contagem.update((valor) => valor + 1);
  }

  finalizar(): void {
    this.contagem.update((valor) => Math.max(0, valor - 1));
  }
}
