import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  mensagem: string;
  tipo: 'sucesso' | 'erro';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private proximoId = 0;
  readonly toasts = signal<Toast[]>([]);

  sucesso(mensagem: string): void {
    this.adicionar(mensagem, 'sucesso');
  }

  erro(mensagem: string): void {
    this.adicionar(mensagem, 'erro');
  }

  remover(id: number): void {
    this.toasts.update((lista) => lista.filter((t) => t.id !== id));
  }

  private adicionar(mensagem: string, tipo: Toast['tipo']): void {
    const id = this.proximoId++;
    this.toasts.update((lista) => [...lista, { id, mensagem, tipo }]);
    setTimeout(() => this.remover(id), 4000);
  }
}
