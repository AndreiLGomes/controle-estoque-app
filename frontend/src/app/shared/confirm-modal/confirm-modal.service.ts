import { Injectable, inject, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';

interface PedidoConfirmacao {
  mensagem: string;
  resolver: (confirmado: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmModalService {
  private readonly router = inject(Router);

  readonly pedidoAtual = signal<PedidoConfirmacao | null>(null);

  constructor() {
    // Cancela qualquer confirmação pendente assim que uma navegação começa —
    // sem isso, um pedido aberto numa tela poderia ser confirmado depois que
    // o usuário já navegou pra outra, executando a ação (ex: exclusão) contra
    // um item que não está mais em foco.
    this.router.events.pipe(filter((evento) => evento instanceof NavigationStart)).subscribe(() => {
      this.pedidoAtual()?.resolver(false);
      this.pedidoAtual.set(null);
    });
  }

  confirmar(mensagem: string): Promise<boolean> {
    this.pedidoAtual()?.resolver(false); // encerra pedido anterior, se houver, sem deixar a Promise pendente
    return new Promise((resolver) => {
      this.pedidoAtual.set({ mensagem, resolver });
    });
  }

  responder(confirmado: boolean): void {
    this.pedidoAtual()?.resolver(confirmado);
    this.pedidoAtual.set(null);
  }
}
