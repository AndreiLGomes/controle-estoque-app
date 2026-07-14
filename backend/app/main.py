from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_db_and_tables

app = FastAPI(title="Controle de Estoque API")

origins = [
    "http://localhost:4200",
    # Adicionar aqui o domínio da Vercel após o primeiro deploy do front-end
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/health")
def health():
    return {"status": "ok"}
