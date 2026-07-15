export interface ResumoDashboard {
  total_produtos: number;
  total_itens_estoque: number;
  produtos_baixo_estoque: number;
}

export interface MovimentacaoPorDia {
  data: string;
  entradas: number;
  saidas: number;
}

export interface ProdutosPorCategoria {
  categoria: string;
  total_produtos: number;
}
