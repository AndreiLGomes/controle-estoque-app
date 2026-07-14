from typing import Optional

from sqlmodel import Field, SQLModel


class Fornecedor(SQLModel, table=True):
    __tablename__ = "fornecedores"

    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    contato: str
