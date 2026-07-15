import { Injectable, signal } from '@angular/core';

interface PedidoConfirmacao {
  mensagem: string;
  resolver: (confirmado: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmModalService {
  readonly pedidoAtual = signal<PedidoConfirmacao | null>(null);

  confirmar(mensagem: string): Promise<boolean> {
    return new Promise((resolver) => {
      this.pedidoAtual.set({ mensagem, resolver });
    });
  }

  responder(confirmado: boolean): void {
    this.pedidoAtual()?.resolver(confirmado);
    this.pedidoAtual.set(null);
  }
}
