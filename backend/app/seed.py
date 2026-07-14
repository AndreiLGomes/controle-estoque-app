import random
from datetime import datetime, timedelta

from sqlmodel import Session, select

from app.database import engine
from app.models import (
    Categoria,
    Fornecedor,
    Movimentacao,
    Produto,
    ProdutoFornecedor,
    TipoMovimentacao,
)

random.seed(42)

CATEGORIAS = ["Eletrônicos", "Alimentos", "Limpeza", "Papelaria"]

FORNECEDORES = [
    ("TechDistribuidora Ltda", "contato@techdistribuidora.com.br"),
    ("Alimentos Bom Sabor", "vendas@bomsabor.com.br"),
    ("Limpa Tudo Suprimentos", "comercial@limpatudo.com.br"),
    ("Papelaria Central", "pedidos@papelariacentral.com.br"),
]

PRODUTOS = [
    ("Mouse sem fio", "Eletrônicos", 59.90, 10),
    ("Teclado mecânico", "Eletrônicos", 189.90, 8),
    ("Fone de ouvido Bluetooth", "Eletrônicos", 129.90, 10),
    ("Carregador USB-C", "Eletrônicos", 39.90, 15),
    ("Arroz 5kg", "Alimentos", 24.90, 20),
    ("Feijão 1kg", "Alimentos", 8.50, 20),
    ("Café 500g", "Alimentos", 14.90, 15),
    ("Óleo de soja 900ml", "Alimentos", 7.90, 20),
    ("Detergente 500ml", "Limpeza", 3.50, 25),
    ("Desinfetante 1L", "Limpeza", 6.90, 20),
    ("Sabão em pó 1kg", "Limpeza", 12.90, 15),
    ("Caderno universitário", "Papelaria", 18.90, 12),
    ("Caneta esferográfica (caixa)", "Papelaria", 15.90, 10),
    ("Resma de papel A4", "Papelaria", 22.90, 10),
]

# Fornecedor "principal" de cada categoria, associado pelo nome (não pela
# posição nas listas CATEGORIAS/FORNECEDORES) — evita que uma futura edição
# desalinhada de uma das duas listas quebre o mapeamento ou derrube o
# startup da aplicação.
FORNECEDOR_PRINCIPAL_POR_CATEGORIA = {
    "Eletrônicos": "TechDistribuidora Ltda",
    "Alimentos": "Alimentos Bom Sabor",
    "Limpeza": "Limpa Tudo Suprimentos",
    "Papelaria": "Papelaria Central",
}

# Produtos que, além do fornecedor "principal" da própria categoria, também
# são fornecidos por um segundo fornecedor — demonstra a relação N:N de
# verdade na demo (distribuidores menores costumam atender mais de uma
# categoria de produto).
VINCULOS_EXTRAS = {
    "Mouse sem fio": ["Papelaria Central"],
    "Café 500g": ["Limpa Tudo Suprimentos"],
}


def seed_data() -> None:
    with Session(engine) as session:
        ja_populado = session.exec(select(Categoria)).first()
        if ja_populado:
            return

        categorias_db: dict[str, Categoria] = {}
        for nome in CATEGORIAS:
            categoria = Categoria(nome=nome)
            session.add(categoria)
            session.flush()
            categorias_db[nome] = categoria

        fornecedores_db: list[Fornecedor] = []
        for nome, contato in FORNECEDORES:
            fornecedor = Fornecedor(nome=nome, contato=contato)
            session.add(fornecedor)
            session.flush()
            fornecedores_db.append(fornecedor)

        fornecedores_por_nome = {f.nome: f for f in fornecedores_db}

        produtos_db: list[Produto] = []
        for nome, categoria_nome, preco, estoque_minimo in PRODUTOS:
            produto = Produto(
                nome=nome,
                preco=preco,
                categoria_id=categorias_db[categoria_nome].id,
                quantidade_estoque=0,
                estoque_minimo=estoque_minimo,
            )
            session.add(produto)
            session.flush()

            nome_fornecedor_principal = FORNECEDOR_PRINCIPAL_POR_CATEGORIA[categoria_nome]
            session.add(
                ProdutoFornecedor(
                    produto_id=produto.id,
                    fornecedor_id=fornecedores_por_nome[nome_fornecedor_principal].id,
                )
            )

            for nome_fornecedor_extra in VINCULOS_EXTRAS.get(nome, []):
                session.add(
                    ProdutoFornecedor(
                        produto_id=produto.id,
                        fornecedor_id=fornecedores_por_nome[nome_fornecedor_extra].id,
                    )
                )

            produtos_db.append(produto)

        agora = datetime.utcnow()
        for produto in produtos_db:
            quantidade_atual = 0
            numero_movimentacoes = random.randint(3, 6)
            for _ in range(numero_movimentacoes):
                dias_atras = random.randint(0, 29)
                data_movimentacao = agora - timedelta(
                    days=dias_atras, hours=random.randint(0, 23)
                )

                if quantidade_atual == 0:
                    tipo = TipoMovimentacao.ENTRADA
                else:
                    tipo = random.choice(
                        [
                            TipoMovimentacao.ENTRADA,
                            TipoMovimentacao.ENTRADA,
                            TipoMovimentacao.SAIDA,
                        ]
                    )

                if tipo == TipoMovimentacao.ENTRADA:
                    quantidade = random.randint(10, 30)
                    quantidade_atual += quantidade
                else:
                    quantidade = random.randint(1, min(quantidade_atual, 10))
                    quantidade_atual -= quantidade

                session.add(
                    Movimentacao(
                        produto_id=produto.id,
                        tipo=tipo,
                        quantidade=quantidade,
                        data=data_movimentacao,
                    )
                )

            produto.quantidade_estoque = quantidade_atual
            session.add(produto)

        # Garante que pelo menos um produto fique abaixo do estoque mínimo,
        # via uma movimentação de saída real (mantém o histórico reconciliado).
        produto_alvo = produtos_db[1]
        limite_desejado = max(produto_alvo.estoque_minimo - 3, 0)
        if produto_alvo.quantidade_estoque > limite_desejado:
            quantidade_saida = produto_alvo.quantidade_estoque - limite_desejado
            session.add(
                Movimentacao(
                    produto_id=produto_alvo.id,
                    tipo=TipoMovimentacao.SAIDA,
                    quantidade=quantidade_saida,
                    data=agora,
                )
            )
            produto_alvo.quantidade_estoque = limite_desejado
            session.add(produto_alvo)

        session.commit()
