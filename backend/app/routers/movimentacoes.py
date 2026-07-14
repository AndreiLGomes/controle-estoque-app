from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlmodel import Session

from app.database import get_session
from app.models import Movimentacao, Produto, TipoMovimentacao
from app.schemas.movimentacao import MovimentacaoCreate, MovimentacaoLeitura

router = APIRouter(prefix="/movimentacoes", tags=["movimentacoes"])


@router.post("", response_model=MovimentacaoLeitura, status_code=201)
def registrar_movimentacao(
    dados: MovimentacaoCreate, session: Session = Depends(get_session)
):
    # Sem checagem inicial de existência aqui: o UPDATE condicional abaixo já
    # cobre "produto não existe" (rowcount 0) e, junto com o bloco de
    # rowcount == 0 mais abaixo, responde 404 corretamente — evita um
    # round-trip a mais no caminho de sucesso.
    if dados.tipo == TipoMovimentacao.ENTRADA:
        resultado = session.execute(
            update(Produto)
            .where(Produto.id == dados.produto_id)
            .values(quantidade_estoque=Produto.quantidade_estoque + dados.quantidade)
            .execution_options(synchronize_session=False)
        )
    else:
        # UPDATE condicional: a checagem de estoque suficiente e o desconto
        # acontecem numa única instrução atômica no banco, não em duas etapas
        # separadas (ler em Python, depois escrever) — isso impede que duas
        # requisições de saída simultâneas leiam o mesmo estoque e ambas
        # passem na validação, deixando a quantidade negativa.
        # synchronize_session=False evita que o SQLAlchemy tente sincronizar
        # objetos já carregados na sessão avaliando a cláusula WHERE em
        # Python contra o valor em memória (que pode estar desatualizado) —
        # sem isso, um objeto em cache poderia ser alterado com um valor
        # "adivinhado" e incorreto, mesmo quando o UPDATE de verdade no
        # banco afetou 0 linhas.
        resultado = session.execute(
            update(Produto)
            .where(
                Produto.id == dados.produto_id,
                Produto.quantidade_estoque >= dados.quantidade,
            )
            .values(quantidade_estoque=Produto.quantidade_estoque - dados.quantidade)
            .execution_options(synchronize_session=False)
        )

    if resultado.rowcount == 0:
        # 0 linhas afetadas: ou o produto não existe (nunca existiu, ou foi
        # excluído por outra requisição concorrente entre a validação acima
        # e este UPDATE), ou (só possível na saída, já que a entrada não tem
        # condição de quantidade no WHERE) o estoque ficou insuficiente nesse
        # meio-tempo. Consultamos a quantidade atual direto por uma coluna
        # (não via session.get, que devolveria um objeto da identity map da
        # sessão — desatualizado e sujeito à mesma armadilha de sincronização
        # do UPDATE acima — em vez do estado de verdade no banco) pra
        # responder com a causa certa.
        quantidade_atual = session.execute(
            select(Produto.quantidade_estoque).where(Produto.id == dados.produto_id)
        ).scalar_one_or_none()
        if quantidade_atual is None:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        raise HTTPException(
            status_code=400,
            detail=(
                f"Estoque insuficiente: quantidade disponível é "
                f"{quantidade_atual}, foi solicitada saída de {dados.quantidade}."
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
