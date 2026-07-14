from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import update
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

    if dados.tipo == TipoMovimentacao.ENTRADA:
        resultado = session.execute(
            update(Produto)
            .where(Produto.id == dados.produto_id)
            .values(quantidade_estoque=Produto.quantidade_estoque + dados.quantidade)
        )
    else:
        # UPDATE condicional: a checagem de estoque suficiente e o desconto
        # acontecem numa única instrução atômica no banco, não em duas etapas
        # separadas (ler em Python, depois escrever) — isso impede que duas
        # requisições de saída simultâneas leiam o mesmo estoque e ambas
        # passem na validação, deixando a quantidade negativa.
        resultado = session.execute(
            update(Produto)
            .where(
                Produto.id == dados.produto_id,
                Produto.quantidade_estoque >= dados.quantidade,
            )
            .values(quantidade_estoque=Produto.quantidade_estoque - dados.quantidade)
        )

    if resultado.rowcount == 0:
        # 0 linhas afetadas: ou o produto foi excluído por outra requisição
        # entre a checagem acima e este UPDATE (vale pra entrada e saída), ou
        # (só possível na saída) o estoque ficou insuficiente nesse meio-tempo.
        # Reconferimos o produto pra responder com a causa certa, em vez de
        # presumir sempre "estoque insuficiente" mesmo quando ele já não existe.
        produto_atual = session.get(Produto, dados.produto_id)
        if not produto_atual:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        raise HTTPException(
            status_code=400,
            detail=(
                f"Estoque insuficiente: quantidade disponível é "
                f"{produto_atual.quantidade_estoque}, foi solicitada saída de {dados.quantidade}."
            ),
        )

    movimentacao = Movimentacao(
        produto_id=dados.produto_id,
        tipo=dados.tipo,
        quantidade=dados.quantidade,
    )
    session.add(movimentacao)

    session.commit()
    session.refresh(movimentacao)
    return movimentacao
