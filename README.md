# fiapx-api

API do **Sistema de Processamento de Vídeos FIAP X**. Responsável por autenticação,
envio de vídeo, consulta de status/catálogo e download dos pacotes gerados.

> Visão geral do sistema, contratos de fila e decisões de arquitetura vivem no
> repositório [`fiapx-infra`](https://github.com/edionay/fiapx-infra).

## Stack

- **Node** ≥ 22
- **Express** 5
- **TypeScript** (ESM)
- **Postgres** com **Prisma** (driver adapter `@prisma/adapter-pg`)
- **TSOA** + **Swagger UI** para rotas e documentação da API, com **tsyringe** para injeção de dependência
- **Vitest** + **supertest** para testes

> Toda a camada HTTP usa controllers TSOA (`health`, `auth` e `videos`), com JWT via
> `@Security` e injeção dos casos de uso por tsyringe.

## Pré-requisitos

- Node ≥ 22 e npm.
- Postgres (opcional em desenvolvimento; sem `DATABASE_URL` a API usa memória).

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

## Documentação da API (Swagger)

A especificação OpenAPI é gerada pelo TSOA a partir dos controllers e servida em:

- **Swagger UI**: `http://localhost:3000/docs`
- **OpenAPI JSON**: `http://localhost:3000/swagger.json`

A geração roda no `postinstall` e no `build` (`npm run gerar`), produzindo as rotas e o
`swagger.json` em `src/gerado/tsoa` (fora do controle de versão, como o cliente do Prisma).

## Autenticação

O acesso às rotas protegidas usa **JWT** no cabeçalho `Authorization: Bearer <token>`.
As variáveis `JWT_SECRET` e `JWT_EXPIRACAO_SEGUNDOS` estão em [`.env.example`](.env.example).

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

## Vídeos

As rotas de vídeo são protegidas por JWT e o catálogo é sempre escopado ao dono. O arquivo
enviado é gravado no diretório configurado em `UPLOADS_DIR`, o vídeo nasce com status `PENDENTE`
e a API publica `videos.processar` no RabbitMQ para o worker processar (contrato no
[fiapx-infra](https://github.com/edionay/fiapx-infra)). Sem `RABBITMQ_URL`, a publicação fica
desligada e o vídeo apenas fica registrado.

| Método | Rota | Protegida | Descrição |
|---|---|---|---|
| POST | `/videos` | sim | Recebe o arquivo no campo `arquivo` (multipart) e cria o vídeo como `PENDENTE`. Responde `202` com `{ "videoId", "status" }`. |
| GET | `/videos` | sim | Lista os vídeos do usuário, do mais recente ao mais antigo. |
| GET | `/videos/:id` | sim | Retorna o status de um vídeo do próprio usuário. Responde `404` se não existir ou for de outro dono. |

```bash
# envio
curl -X POST http://localhost:3000/videos \
  -H "Authorization: Bearer <token>" \
  -F "arquivo=@filme.mp4"

# catálogo do usuário
curl http://localhost:3000/videos -H "Authorization: Bearer <token>"

# status de um vídeo
curl http://localhost:3000/videos/<videoId> -H "Authorization: Bearer <token>"
```

> O catálogo não expõe caminhos internos de arquivo. O consumo de `videos.resultado` (para
> atualizar o status) e o download do pacote entram nas próximas etapas.

## Banco de dados

A persistência usa **Postgres** através do **Prisma** (driver adapter `@prisma/adapter-pg`).
A conexão vem de `DATABASE_URL`. Sem essa variável a API cai para persistência em memória,
o que é conveniente em desenvolvimento e nos testes.

O cliente Prisma é gerado em `src/gerado/prisma` (fora do controle de versão) por
`prisma generate`, que roda sozinho no `postinstall` e no `build`.

```bash
# aplica as migrações e gera o cliente (desenvolvimento)
npm run prisma:migrate

# aplica as migrações pendentes (produção)
npm run prisma:deploy

# apenas regenera o cliente
npm run prisma:generate
```

O modelo `Usuario` mapeia a tabela `usuarios`. A tabela de vídeos entra na etapa de vídeo.

## Docker

O `Dockerfile` deste repositório empacota apenas o serviço da API. Ele é multi-stage:
compila o TypeScript e o cliente Prisma em um estágio de build e produz uma imagem final
enxuta (só dependências de produção, usuário não-root e healthcheck em `/health`).

A orquestração completa da stack (Postgres, RabbitMQ, Redis e os demais serviços) fica no
repositório `fiapx-infra`, cujo `docker-compose.yml` referencia este Dockerfile por
`build: ../fiapx-api`. O `docker-compose.yml` deste repositório é apenas uma conveniência
para desenvolvimento local, subindo a API junto de um Postgres.

```bash
# sobe API + Postgres localmente (aplica as migrações antes de iniciar a API)
docker compose up --build

# a API fica em http://localhost:3000 e o Postgres em localhost:5432
```

As migrações são aplicadas por um serviço `migrate` dedicado, que roda `prisma migrate deploy`
antes de a API iniciar. A imagem da API não executa migrações no start, mantendo o start rápido
e previsível.

```bash
# construir e rodar apenas a imagem da API (Postgres por conta de quem chama)
docker build -t fiapx-api .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://usuario:senha@host:5432/fiapx?schema=public" \
  -e JWT_SECRET="troque-este-segredo" \
  fiapx-api
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

## Integração contínua

O workflow em `.github/workflows/ci.yml` roda a cada pull request e push na `main`. Ele
sobe um Postgres de serviço, instala as dependências, aplica as migrações e executa
`typecheck`, `test` e `build`. Como o `DATABASE_URL` está presente, os testes de
integração com banco rodam de verdade.

## Estrutura

O código segue Clean Architecture, com as dependências apontando para o domínio:
`dominio` (regras e contratos) ← `aplicacao` (casos de uso) ← `adaptadores` (Express, JWT, bcrypt, repositório).

```
Dockerfile                    # imagem multi-stage do serviço da API
docker-compose.yml            # conveniência local: API + Postgres
tsoa.json                     # configuração do TSOA (controllers, spec e rotas)
prisma/
├── schema.prisma             # modelo Usuario (tabela usuarios)
└── migrations/               # migrações versionadas
prisma.config.ts              # configuração do Prisma (datasource das migrações)
src/
├── app.ts                    # raiz de composição: monta a aplicação Express
├── server.ts                 # sobe o servidor HTTP e escolhe o repositório
├── controllers/              # controllers TSOA (health, auth e videos)
├── config/
│   └── env.ts                # configuração lida do ambiente
├── dominio/                  # entidades (usuario, video), contratos e erros
├── aplicacao/                # casos de uso (cadastrar, autenticar, enviar vídeo) e portas
└── adaptadores/              # repositórios (memória e Prisma), bcrypt, JWT, armazenamento
    ├── http/                 # autenticação JWT, IoC (tsyringe), tokens e tratador de erros
    ├── mensageria/           # publicação no RabbitMQ (videos.processar) e publisher nulo
    └── prisma/               # criação do PrismaClient com o adapter
test/
├── health.test.ts
├── auth/                     # testes unitários e de integração da autenticação
├── video/                    # testes do envio de vídeo (caso de uso e HTTP)
└── db/                       # integração dos repositórios Prisma (roda com DATABASE_URL)
```
