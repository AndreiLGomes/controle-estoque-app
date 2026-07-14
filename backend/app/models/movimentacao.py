from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class TipoMovimentacao(str, Enum):
    ENTRADA = "entrada"
    SAIDA = "saída"


class Movimentacao(SQLModel, table=True):
    __tablename__ = "movimentacoes"

    id: Optional[int] = Field(default=None, primary_key=True)
    produto_id: int = Field(foreign_key="produtos.id")
    tipo: TipoMovimentacao
    quantidade: int
    data: datetime = Field(default_factory=datetime.utcnow)
