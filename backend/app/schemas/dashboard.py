from datetime import date

from sqlmodel import SQLModel


class ResumoDashboard(SQLModel):
    total_produtos: int
    total_itens_estoque: int
    produtos_baixo_estoque: int


class MovimentacaoPorDia(SQLModel):
    data: date
    entradas: int
    saidas: int


class ProdutosPorCategoria(SQLModel):
    categoria: str
    total_produtos: int
