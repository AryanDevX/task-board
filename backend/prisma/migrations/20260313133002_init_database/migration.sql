/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Column` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Column` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `WorkflowTransition` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[boardId,fromColumnId,toColumnId]` on the table `WorkflowTransition` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `boardId` to the `Column` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `boardId` to the `WorkflowTransition` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Column" DROP CONSTRAINT "Column_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectMembership" DROP CONSTRAINT "ProjectMembership_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectMembership" DROP CONSTRAINT "ProjectMembership_userId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkflowTransition" DROP CONSTRAINT "WorkflowTransition_projectId_fkey";

-- DropIndex
DROP INDEX "WorkflowTransition_projectId_fromColumnId_toColumnId_key";

-- AlterTable
ALTER TABLE "Column" DROP COLUMN "createdAt",
DROP COLUMN "projectId",
ADD COLUMN     "boardId" INTEGER NOT NULL,
ADD COLUMN     "wipLimit" INTEGER;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "order" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "WorkflowTransition" DROP COLUMN "projectId",
ADD COLUMN     "boardId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Board" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTransition_boardId_fromColumnId_toColumnId_key" ON "WorkflowTransition"("boardId", "fromColumnId", "toColumnId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMembership" ADD CONSTRAINT "ProjectMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMembership" ADD CONSTRAINT "ProjectMembership_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Column" ADD CONSTRAINT "Column_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
