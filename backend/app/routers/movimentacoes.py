from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.models import Movimentacao, Produto, TipoMovimentacao
from app.schemas.movimentacao import MovimentacaoCreate, MovimentacaoLeitura

router = APIRouter(prefix="/movimentacoes", tags=["movimentacoes"])


@router.post("", response_model=MovimentacaoLeitura, status_code=201)
def registrar_movimentacao(
    dados: MovimentacaoCreate, session: Session = Depends(get_session)
):
    produto = session.get(Produto, dados.produto_id)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    if (
        dados.tipo == TipoMovimentacao.SAIDA
        and dados.quantidade > produto.quantidade_estoque
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Estoque insuficiente: quantidade disponível é "
                f"{produto.quantidade_estoque}, foi solicitada saída de {dados.quantidade}."
            ),
        )

    movimentacao = Movimentacao(
        produto_id=dados.produto_id,
        tipo=dados.tipo,
        quantidade=dados.quantidade,
    )
    session.add(movimentacao)

    if dados.tipo == TipoMovimentacao.ENTRADA:
        produto.quantidade_estoque += dados.quantidade
    else:
        produto.quantidade_estoque -= dados.quantidade
    session.add(produto)

    session.commit()
    session.refresh(movimentacao)
    return movimentacao
