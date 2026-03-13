/*
  Warnings:

  - You are about to drop the column `title` on the `Board` table. All the data in the column will be lost.
  - You are about to alter the column `order` on the `Task` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - A unique constraint covering the columns `[boardId,order]` on the table `Column` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[columnId,order]` on the table `Task` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,boardId,fromColumnId,toColumnId]` on the table `WorkflowTransition` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Board` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `WorkflowTransition` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Column" DROP CONSTRAINT "Column_boardId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectMembership" DROP CONSTRAINT "ProjectMembership_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectMembership" DROP CONSTRAINT "ProjectMembership_userId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_columnId_fkey";

-- DropForeignKey
ALTER TABLE "WorkflowTransition" DROP CONSTRAINT "WorkflowTransition_boardId_fkey";

-- DropForeignKey
ALTER TABLE "WorkflowTransition" DROP CONSTRAINT "WorkflowTransition_fromColumnId_fkey";

-- DropForeignKey
ALTER TABLE "WorkflowTransition" DROP CONSTRAINT "WorkflowTransition_toColumnId_fkey";

-- DropIndex
DROP INDEX "WorkflowTransition_boardId_fromColumnId_toColumnId_key";

-- AlterTable
ALTER TABLE "Board" DROP COLUMN "title",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Column" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "order" SET DATA TYPE INTEGER,
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkflowTransition" ADD COLUMN     "projectId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "AuditLog_taskId_idx" ON "AuditLog"("taskId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "Board_projectId_idx" ON "Board"("projectId");

-- CreateIndex
CREATE INDEX "Column_boardId_idx" ON "Column"("boardId");

-- CreateIndex
CREATE UNIQUE INDEX "Column_boardId_order_key" ON "Column"("boardId", "order");

-- CreateIndex
CREATE INDEX "Comment_taskId_idx" ON "Comment"("taskId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_taskId_idx" ON "Notification"("taskId");

-- CreateIndex
CREATE INDEX "Project_createdById_idx" ON "Project"("createdById");

-- CreateIndex
CREATE INDEX "ProjectMembership_projectId_idx" ON "ProjectMembership"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMembership_userId_idx" ON "ProjectMembership"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Task_columnId_order_idx" ON "Task"("columnId", "order");

-- CreateIndex
CREATE INDEX "Task_columnId_idx" ON "Task"("columnId");

-- CreateIndex
CREATE INDEX "Task_parentId_idx" ON "Task"("parentId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "Task_reporterId_idx" ON "Task"("reporterId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_columnId_order_key" ON "Task"("columnId", "order");

-- CreateIndex
CREATE INDEX "WorkflowTransition_boardId_fromColumnId_idx" ON "WorkflowTransition"("boardId", "fromColumnId");

-- CreateIndex
CREATE INDEX "WorkflowTransition_projectId_idx" ON "WorkflowTransition"("projectId");

-- CreateIndex
CREATE INDEX "WorkflowTransition_boardId_idx" ON "WorkflowTransition"("boardId");

-- CreateIndex
CREATE INDEX "WorkflowTransition_fromColumnId_idx" ON "WorkflowTransition"("fromColumnId");

-- CreateIndex
CREATE INDEX "WorkflowTransition_toColumnId_idx" ON "WorkflowTransition"("toColumnId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTransition_projectId_boardId_fromColumnId_toColumnI_key" ON "WorkflowTransition"("projectId", "boardId", "fromColumnId", "toColumnId");

-- AddForeignKey
ALTER TABLE "ProjectMembership" ADD CONSTRAINT "ProjectMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMembership" ADD CONSTRAINT "ProjectMembership_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Column" ADD CONSTRAINT "Column_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_fromColumnId_fkey" FOREIGN KEY ("fromColumnId") REFERENCES "Column"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_toColumnId_fkey" FOREIGN KEY ("toColumnId") REFERENCES "Column"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
