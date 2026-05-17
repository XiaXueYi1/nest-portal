-- DropIndex
DROP INDEX "canvas_edges_canvasId_sourceId_targetId_key";

-- AlterTable
ALTER TABLE "canvas_edges" ADD COLUMN     "sourcePortId" TEXT,
ADD COLUMN     "targetPortId" TEXT;
