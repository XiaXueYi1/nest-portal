-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'system', 'tool');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('generating', 'done', 'error', 'stopped');

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agent_key" VARCHAR(100) NOT NULL DEFAULT 'default',
    "title" VARCHAR(255) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "parentId" TEXT,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "status" "MessageStatus" NOT NULL DEFAULT 'done',
    "seq" INTEGER NOT NULL,
    "model" VARCHAR(50),
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_userId_idx" ON "conversations"("userId");

-- CreateIndex
CREATE INDEX "conversations_userId_agent_key_updated_at_idx" ON "conversations"("userId", "agent_key", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "conversations_updated_at_idx" ON "conversations"("updated_at" DESC);

-- CreateIndex
CREATE INDEX "messages_conversationId_seq_idx" ON "messages"("conversationId", "seq");

-- CreateIndex
CREATE INDEX "messages_parentId_idx" ON "messages"("parentId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "messages"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
