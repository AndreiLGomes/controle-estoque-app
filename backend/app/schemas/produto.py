from pydantic import field_validator
from sqlmodel import SQLModel


class ProdutoBase(SQLModel):
    nome: str
    preco: float
    categoria_id: int
    estoque_minimo: int = 10
    fornecedor_ids: list[int] = []

    @field_validator("preco")
    @classmethod
    def preco_nao_negativo(cls, valor: float) -> float:
        if valor < 0:
            raise ValueError("O preço não pode ser negativo.")
        return valor

    @field_validator("estoque_minimo")
    @classmethod
    def estoque_minimo_nao_negativo(cls, valor: int) -> int:
        if valor < 0:
            raise ValueError("O estoque mínimo não pode ser negativo.")
        return valor


class ProdutoCreate(ProdutoBase):
    pass


class ProdutoUpdate(ProdutoBase):
    pass


class ProdutoLeitura(SQLModel):
    id: int
    nome: str
    preco: float
    categoria_id: int
    quantidade_estoque: int
    estoque_minimo: int
    fornecedor_ids: list[int] = []
