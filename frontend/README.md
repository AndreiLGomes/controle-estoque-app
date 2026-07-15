# Front-end — Controle de Estoque

Interface Angular 19 (Standalone Components + Signals) do sistema de
controle de estoque. Consome a API FastAPI em `backend/`.

## Rodando localmente

```bash
npm install
npm start
```

Abre em `http://localhost:4200`. Por padrão aponta para a API em
`http://localhost:8000` (ver `src/environments/environment.ts`) — suba o
back-end antes (`cd ../backend && uvicorn app.main:app --reload`).

## Build de produção

```bash
npm run build
```

Usa `src/environments/environment.prod.ts`, que precisa ter `apiUrl`
apontando para o endereço real do back-end publicado no Render.
