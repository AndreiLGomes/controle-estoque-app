from datetime import datetime

from pydantic import field_validator
from sqlmodel import SQLModel

from app.models import TipoMovimentacao


class MovimentacaoCreate(SQLModel):
    produto_id: int
    tipo: TipoMovimentacao
    quantidade: int

    @field_validator("quantidade")
    @classmethod
    def quantidade_positiva(cls, valor: int) -> int:
        if valor <= 0:
            raise ValueError("A quantidade da movimentação deve ser maior que zero.")
        return valor


class MovimentacaoLeitura(SQLModel):
    id: int
    produto_id: int
    tipo: TipoMovimentacao
    quantidade: int
    data: datetime
