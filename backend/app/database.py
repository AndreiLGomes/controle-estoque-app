from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = "sqlite:///./estoque.db"

engine = create_engine(DATABASE_URL, echo=False)

# Limitação conhecida e aceita (baixo risco pro tamanho deste projeto):
# alguns endpoints de exclusão/atualização (excluir_categoria,
# excluir_produto, atualizar_produto, atualizar_fornecedor,
# excluir_fornecedor) fazem "checar dependentes/estado, depois
# excluir/atualizar" sem reconferir de forma atômica, diferente do
# POST /movimentacoes (que usa UPDATE condicional com
# synchronize_session=False). Sob concorrência real, isso poderia gerar um
# 500 (StaleDataError) em vez de uma resposta 404/400 limpa — não corrompe
# dado, só um erro malformado numa janela de corrida bem estreita.


def create_db_and_tables() -> None:
    from app import models  # garante que todos os modelos estão registrados

    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
