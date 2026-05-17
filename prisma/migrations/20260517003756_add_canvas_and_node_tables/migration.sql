-- CreateEnum
CREATE TYPE "NodeCategory" AS ENUM ('COMMON', 'VUE', 'REACT', 'PROJECT');

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_userId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_parentId_fkey";

-- CreateTable
CREATE TABLE "canvases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "framework" TEXT,
    "thumbnail" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "canvases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canvas_nodes" (
    "id" TEXT NOT NULL,
    "canvasId" TEXT NOT NULL,
    "templateId" TEXT,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "note" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canvas_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canvas_edges" (
    "id" TEXT NOT NULL,
    "canvasId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "label" TEXT,
    "style" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canvas_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "NodeCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "node_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "canvas_edges_canvasId_sourceId_targetId_key" ON "canvas_edges"("canvasId", "sourceId", "targetId");
