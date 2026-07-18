# fiapx-api

API do **Sistema de Processamento de Vídeos FIAP X**. Responsável por autenticação,
envio de vídeo, consulta de status/catálogo e download dos pacotes gerados.

> Visão geral do sistema, contratos de fila e decisões de arquitetura vivem no
> repositório [`fiapx-infra`](https://github.com/edionay/fiapx-infra).

## Stack

- **Node** ≥ 22
- **Express** 5
- **TypeScript** (ESM)
- **Vitest** + **supertest** para testes

> O TSOA/Swagger entra em uma etapa seguinte. Este é o servidor inicial.

## Pré-requisitos

- Node ≥ 22 e npm.

## Instalação

```bash
npm install
```

## Como rodar

```bash
# desenvolvimento (reinício automático a cada alteração)
npm run dev

# build + produção
npm run build
npm start
```

Por padrão o servidor sobe em `http://localhost:3000`. A porta pode ser
configurada pela variável `PORT` (ver [`.env.example`](.env.example)).

### Sonda de saúde

```bash
curl http://localhost:3000/health
```

```json
{ "status": "ok", "service": "fiapx-api", "timestamp": "...", "uptime": 1.23 }
```

## Testes

```bash
npm test          # executa uma vez
npm run test:watch
```

## Verificação de tipos

```bash
npm run typecheck
```

## Estrutura

```
src/
├── app.ts            # monta a aplicação Express (sem escutar porta)
├── server.ts         # sobe o servidor HTTP
├── config/
│   └── env.ts        # configuração lida do ambiente
└── routes/
    └── health.ts     # GET /health
test/
└── health.test.ts
```
