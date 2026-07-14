from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.models import Categoria, Movimentacao, Produto, TipoMovimentacao
from app.schemas.dashboard import MovimentacaoPorDia, ProdutosPorCategoria, ResumoDashboard

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/resumo", response_model=ResumoDashboard)
def resumo(session: Session = Depends(get_session)):
    produtos = session.exec(select(Produto)).all()
    return ResumoDashboard(
        total_produtos=len(produtos),
        total_itens_estoque=sum(p.quantidade_estoque for p in produtos),
        produtos_baixo_estoque=sum(1 for p in produtos if p.esta_com_baixo_estoque),
    )


@router.get("/movimentacoes-30-dias", response_model=list[MovimentacaoPorDia])
def movimentacoes_30_dias(session: Session = Depends(get_session)):
    limite = datetime.utcnow() - timedelta(days=30)
    movimentacoes = session.exec(
        select(Movimentacao).where(Movimentacao.data >= limite)
    ).all()

    por_dia: dict[str, dict[str, int]] = defaultdict(lambda: {"entradas": 0, "saidas": 0})
    for movimentacao in movimentacoes:
        chave = movimentacao.data.date().isoformat()
        if movimentacao.tipo == TipoMovimentacao.ENTRADA:
            por_dia[chave]["entradas"] += movimentacao.quantidade
        else:
            por_dia[chave]["saidas"] += movimentacao.quantidade

    return [
        MovimentacaoPorDia(data=dia, entradas=valores["entradas"], saidas=valores["saidas"])
        for dia, valores in sorted(por_dia.items())
    ]


@router.get("/produtos-por-categoria", response_model=list[ProdutosPorCategoria])
def produtos_por_categoria(session: Session = Depends(get_session)):
    categorias = session.exec(select(Categoria)).all()
    produtos = session.exec(select(Produto)).all()

    contagem: dict[int, int] = defaultdict(int)
    for produto in produtos:
        contagem[produto.categoria_id] += 1

    return [
        ProdutosPorCategoria(categoria=categoria.nome, total_produtos=contagem[categoria.id])
        for categoria in categorias
    ]
