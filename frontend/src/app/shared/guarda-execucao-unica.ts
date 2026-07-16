import { signal } from '@angular/core';

/**
 * Impede que a mesma ação assíncrona rode duas vezes em paralelo (ex: duplo
 * clique ou Enter duplicado num formulário) — chamadas que chegam enquanto a
 * anterior ainda está em andamento são silenciosamente ignoradas.
 */
export class GuardaExecucaoUnica {
  private readonly emAndamentoSignal = signal(false);
  readonly emAndamento = this.emAndamentoSignal.asReadonly();

  async executar(tarefa: () => Promise<void>): Promise<void> {
    if (this.emAndamentoSignal()) {
      return;
    }
    this.emAndamentoSignal.set(true);
    try {
      await tarefa();
    } finally {
      this.emAndamentoSignal.set(false);
    }
  }
}
