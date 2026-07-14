from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import Categoria, Produto

router = APIRouter(prefix="/categorias", tags=["categorias"])


@router.get("", response_model=list[Categoria])
def listar_categorias(session: Session = Depends(get_session)):
    return session.exec(select(Categoria)).all()


@router.post("", response_model=Categoria, status_code=201)
def criar_categoria(categoria: Categoria, session: Session = Depends(get_session)):
    categoria.id = None
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    return categoria


@router.put("/{categoria_id}", response_model=Categoria)
def atualizar_categoria(
    categoria_id: int, dados: Categoria, session: Session = Depends(get_session)
):
    categoria = session.get(Categoria, categoria_id)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    categoria.nome = dados.nome
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    return categoria


@router.delete("/{categoria_id}", status_code=204)
def excluir_categoria(categoria_id: int, session: Session = Depends(get_session)):
    categoria = session.get(Categoria, categoria_id)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")

    produtos_vinculados = session.exec(
        select(Produto).where(Produto.categoria_id == categoria_id)
    ).all()
    if produtos_vinculados:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Não é possível excluir esta categoria: existem "
                f"{len(produtos_vinculados)} produto(s) vinculado(s) a ela."
            ),
        )

    session.delete(categoria)
    session.commit()
