from typing import Optional

from sqlmodel import Field, SQLModel


class Produto(SQLModel, table=True):
    __tablename__ = "produtos"

    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    preco: float
    categoria_id: int = Field(foreign_key="categorias.id")
    quantidade_estoque: int = Field(default=0)
    estoque_minimo: int = Field(default=10)

    @property
    def esta_com_baixo_estoque(self) -> bool:
        return self.quantidade_estoque < self.estoque_minimo
