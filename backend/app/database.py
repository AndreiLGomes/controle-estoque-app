from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = "sqlite:///./estoque.db"

engine = create_engine(DATABASE_URL, echo=False)


def create_db_and_tables() -> None:
    from app import models  # garante que todos os modelos estão registrados

    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
