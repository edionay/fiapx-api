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

## Autenticação

O acesso às rotas protegidas usa **JWT** no cabeçalho `Authorization: Bearer <token>`.
As variáveis `JWT_SECRET` e `JWT_EXPIRACAO_SEGUNDOS` estão em [`.env.example`](.env.example).

> A persistência hoje é **em memória** (os usuários somem quando o processo reinicia).
> A ligação com o Postgres entra em uma etapa seguinte.

| Método | Rota | Protegida | Descrição |
|---|---|---|---|
| POST | `/auth/cadastro` | não | Cria um usuário. Corpo: `{ "email", "senha" }`. Senha com no mínimo 8 caracteres. |
| POST | `/auth/login` | não | Valida as credenciais e devolve `{ "token" }`. |
| GET | `/auth/eu` | sim | Devolve os dados do usuário do token. |

### Exemplo

```bash
# cadastro
curl -X POST http://localhost:3000/auth/cadastro \
  -H 'Content-Type: application/json' \
  -d '{"email":"fulano@email.com","senha":"senhaforte1"}'

# login (guarde o token retornado)
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"fulano@email.com","senha":"senhaforte1"}'

# rota protegida
curl http://localhost:3000/auth/eu -H "Authorization: Bearer <token>"
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

O código segue Clean Architecture, com as dependências apontando para o domínio:
`dominio` (regras e contratos) ← `aplicacao` (casos de uso) ← `adaptadores` (Express, JWT, bcrypt, repositório).

```
src/
├── app.ts                    # raiz de composição: monta a aplicação Express
├── server.ts                 # sobe o servidor HTTP
├── config/
│   └── env.ts                # configuração lida do ambiente
├── dominio/                  # entidades, contratos de repositório e erros
├── aplicacao/                # casos de uso (cadastrar, autenticar) e portas
├── adaptadores/              # implementações: repositório em memória, bcrypt, JWT
│   └── http/                 # rotas, middleware de auth e tratador de erros
└── routes/
    └── health.ts             # GET /health
test/
├── health.test.ts
└── auth/                     # testes unitários e de integração da autenticação
```
