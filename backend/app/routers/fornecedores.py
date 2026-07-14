from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import Fornecedor, ProdutoFornecedor

router = APIRouter(prefix="/fornecedores", tags=["fornecedores"])


@router.get("", response_model=list[Fornecedor])
def listar_fornecedores(session: Session = Depends(get_session)):
    return session.exec(select(Fornecedor)).all()


@router.post("", response_model=Fornecedor, status_code=201)
def criar_fornecedor(fornecedor: Fornecedor, session: Session = Depends(get_session)):
    fornecedor.id = None
    session.add(fornecedor)
    session.commit()
    session.refresh(fornecedor)
    return fornecedor


@router.put("/{fornecedor_id}", response_model=Fornecedor)
def atualizar_fornecedor(
    fornecedor_id: int, dados: Fornecedor, session: Session = Depends(get_session)
):
    fornecedor = session.get(Fornecedor, fornecedor_id)
    if not fornecedor:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    fornecedor.nome = dados.nome
    fornecedor.contato = dados.contato
    session.add(fornecedor)
    session.commit()
    session.refresh(fornecedor)
    return fornecedor


@router.delete("/{fornecedor_id}", status_code=204)
def excluir_fornecedor(fornecedor_id: int, session: Session = Depends(get_session)):
    fornecedor = session.get(Fornecedor, fornecedor_id)
    if not fornecedor:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

    vinculos = session.exec(
        select(ProdutoFornecedor).where(ProdutoFornecedor.fornecedor_id == fornecedor_id)
    ).all()
    for vinculo in vinculos:
        session.delete(vinculo)

    session.delete(fornecedor)
    session.commit()
