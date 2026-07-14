from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_db_and_tables
from app.seed import seed_data
from app.routers.categorias import router as categorias_router
from app.routers.dashboard import router as dashboard_router
from app.routers.fornecedores import router as fornecedores_router
from app.routers.movimentacoes import router as movimentacoes_router
from app.routers.produtos import router as produtos_router

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

app.include_router(categorias_router)
app.include_router(dashboard_router)
app.include_router(fornecedores_router)
app.include_router(produtos_router)
app.include_router(movimentacoes_router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    seed_data()


@app.get("/health")
def health():
    return {"status": "ok"}
