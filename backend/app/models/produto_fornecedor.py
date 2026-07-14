from typing import Optional

from sqlmodel import Field, SQLModel


class ProdutoFornecedor(SQLModel, table=True):
    __tablename__ = "produto_fornecedor"

    id: Optional[int] = Field(default=None, primary_key=True)
    produto_id: int = Field(foreign_key="produtos.id")
    fornecedor_id: int = Field(foreign_key="fornecedores.id")
