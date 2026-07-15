export interface Produto {
  id: number;
  nome: string;
  preco: number;
  categoria_id: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  fornecedor_ids: number[];
}

// quantidade_estoque nunca aparece aqui: o back-end sempre cria o produto
// com estoque zerado e só altera esse valor através do endpoint de
// movimentações (Task 9), nunca por criação/edição direta do produto.
export interface ProdutoEntrada {
  nome: string;
  preco: number;
  categoria_id: number;
  estoque_minimo: number;
  fornecedor_ids: number[];
}

export interface ProdutoFiltros {
  categoriaId?: number;
  busca?: string;
  ordenarPor?: 'nome' | 'preco' | 'quantidade_estoque';
}
