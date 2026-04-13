-- DropForeignKey
ALTER TABLE "Element" DROP CONSTRAINT "Element_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_adminId_fkey";

-- AlterTable
ALTER TABLE "Element" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'waiting',
ALTER COLUMN "adminId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "UserPresence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" INTEGER NOT NULL,
    "cursor" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPresence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPresence_roomId_isActive_idx" ON "UserPresence"("roomId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "UserPresence_userId_roomId_key" ON "UserPresence"("userId", "roomId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Element" ADD CONSTRAINT "Element_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPresence" ADD CONSTRAINT "UserPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPresence" ADD CONSTRAINT "UserPresence_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
