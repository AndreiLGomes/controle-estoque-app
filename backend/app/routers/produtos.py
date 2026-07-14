from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.database import get_session
from app.models import Categoria, Fornecedor, Produto, ProdutoFornecedor
from app.schemas.produto import ProdutoCreate, ProdutoLeitura, ProdutoUpdate

router = APIRouter(prefix="/produtos", tags=["produtos"])


def _para_leitura(produto: Produto, session: Session) -> ProdutoLeitura:
    vinculos = session.exec(
        select(ProdutoFornecedor).where(ProdutoFornecedor.produto_id == produto.id)
    ).all()
    return ProdutoLeitura(
        id=produto.id,
        nome=produto.nome,
        preco=produto.preco,
        categoria_id=produto.categoria_id,
        quantidade_estoque=produto.quantidade_estoque,
        estoque_minimo=produto.estoque_minimo,
        fornecedor_ids=[v.fornecedor_id for v in vinculos],
    )


def _sincronizar_fornecedores(
    produto_id: int, fornecedor_ids: list[int], session: Session
) -> None:
    for fornecedor_id in fornecedor_ids:
        fornecedor = session.get(Fornecedor, fornecedor_id)
        if not fornecedor:
            raise HTTPException(
                status_code=400,
                detail=f"Fornecedor de id {fornecedor_id} não existe.",
            )

    vinculos_atuais = session.exec(
        select(ProdutoFornecedor).where(ProdutoFornecedor.produto_id == produto_id)
    ).all()
    for vinculo in vinculos_atuais:
        session.delete(vinculo)

    for fornecedor_id in fornecedor_ids:
        session.add(ProdutoFornecedor(produto_id=produto_id, fornecedor_id=fornecedor_id))


@router.get("", response_model=list[ProdutoLeitura])
def listar_produtos(
    categoria_id: Optional[int] = None,
    busca: Optional[str] = None,
    ordenar_por: Optional[str] = Query(
        default=None, pattern="^(nome|preco|quantidade_estoque)$"
    ),
    session: Session = Depends(get_session),
):
    consulta = select(Produto)

    if categoria_id is not None:
        consulta = consulta.where(Produto.categoria_id == categoria_id)
    if busca:
        consulta = consulta.where(Produto.nome.ilike(f"%{busca}%"))
    if ordenar_por == "nome":
        consulta = consulta.order_by(Produto.nome)
    elif ordenar_por == "preco":
        consulta = consulta.order_by(Produto.preco)
    elif ordenar_por == "quantidade_estoque":
        consulta = consulta.order_by(Produto.quantidade_estoque)

    produtos = session.exec(consulta).all()
    return [_para_leitura(produto, session) for produto in produtos]


@router.get("/baixo-estoque", response_model=list[ProdutoLeitura])
def listar_produtos_baixo_estoque(session: Session = Depends(get_session)):
    produtos = session.exec(select(Produto)).all()
    produtos_baixo_estoque = [
        p for p in produtos if p.quantidade_estoque < p.estoque_minimo
    ]
    return [_para_leitura(produto, session) for produto in produtos_baixo_estoque]


@router.get("/{produto_id}", response_model=ProdutoLeitura)
def obter_produto(produto_id: int, session: Session = Depends(get_session)):
    produto = session.get(Produto, produto_id)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return _para_leitura(produto, session)


@router.post("", response_model=ProdutoLeitura, status_code=201)
def criar_produto(dados: ProdutoCreate, session: Session = Depends(get_session)):
    categoria = session.get(Categoria, dados.categoria_id)
    if not categoria:
        raise HTTPException(status_code=400, detail="Categoria informada não existe.")

    produto = Produto(
        nome=dados.nome,
        preco=dados.preco,
        categoria_id=dados.categoria_id,
        estoque_minimo=dados.estoque_minimo,
        quantidade_estoque=0,
    )
    session.add(produto)
    session.flush()

    _sincronizar_fornecedores(produto.id, dados.fornecedor_ids, session)

    session.commit()
    session.refresh(produto)
    return _para_leitura(produto, session)


@router.put("/{produto_id}", response_model=ProdutoLeitura)
def atualizar_produto(
    produto_id: int, dados: ProdutoUpdate, session: Session = Depends(get_session)
):
    produto = session.get(Produto, produto_id)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    categoria = session.get(Categoria, dados.categoria_id)
    if not categoria:
        raise HTTPException(status_code=400, detail="Categoria informada não existe.")

    produto.nome = dados.nome
    produto.preco = dados.preco
    produto.categoria_id = dados.categoria_id
    produto.estoque_minimo = dados.estoque_minimo
    session.add(produto)

    _sincronizar_fornecedores(produto.id, dados.fornecedor_ids, session)

    session.commit()
    session.refresh(produto)
    return _para_leitura(produto, session)
