-- CreateEnum
CREATE TYPE "StatusVideo" AS ENUM ('PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'ERRO');

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "nome_original" TEXT NOT NULL,
    "caminho_entrada" TEXT NOT NULL,
    "status" "StatusVideo" NOT NULL DEFAULT 'PENDENTE',
    "caminho_zip" TEXT,
    "mensagem_erro" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "videos_usuario_id_idx" ON "videos"("usuario_id");

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
